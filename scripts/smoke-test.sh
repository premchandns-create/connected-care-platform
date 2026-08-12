#!/usr/bin/env bash
# Cross-platform (macOS/Linux) smoke test for Connected Care Platform (demo)
# Saves JSON responses to ../smoke/*.json and ../smoke/smoke-summary.json

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$SCRIPT_DIR/../smoke"
mkdir -p "$OUT_DIR"

API_BASE="${1:-http://localhost:5080}"

# Require curl and python3 or python
if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required to run this script." >&2
  exit 2
fi
PY=""
if command -v python3 >/dev/null 2>&1; then
  PY=python3
elif command -v python >/dev/null 2>&1; then
  PY=python
else
  echo "python3 or python is required to run this script." >&2
  exit 2
fi

RESULTS_TMP=$(mktemp)
trap 'rm -f "$RESULTS_TMP"' EXIT

save_response() {
  local name="$1"; shift
  local content_file="$OUT_DIR/${name}.json"
  cat > "$content_file"
  echo "$content_file"
}

add_result() {
  local name="$1"; local url="$2"; local status="$3"; local file="$4"; local error="$5"
  # Use python to safely encode JSON object and append as a line
  $PY -c "import json,sys; obj={'name':sys.argv[1],'url':sys.argv[2],'status':sys.argv[3],'file':sys.argv[4]}; err=sys.argv[5];\nif err!='': obj['error']=err; print(json.dumps(obj))" "$name" "$url" "$status" "$file" "$error" >> "$RESULTS_TMP"
}

perform_get() {
  local name="$1"; local url="$2"
  echo "GET $url"
  if curl -sS -f "$url" -o "$OUT_DIR/${name}.json"; then
    add_result "$name" "$url" "OK" "$OUT_DIR/${name}.json" ""
  else
    local err="Failed to GET $url"
    echo "$err" >&2
    # Save any partial response if exists
    add_result "$name" "$url" "ERROR" "" "$err"
  fi
}

perform_post() {
  local name="$1"; local url="$2"; local body="$3"
  echo "POST $url"
  if curl -sS -f -X POST -H "Content-Type: application/json" -d "$body" "$url" -o "$OUT_DIR/${name}.json"; then
    add_result "$name" "$url" "OK" "$OUT_DIR/${name}.json" ""
  else
    local err="Failed to POST $url"
    echo "$err" >&2
    add_result "$name" "$url" "ERROR" "" "$err"
  fi
}

# Run GET endpoints
perform_get "health" "$API_BASE/api/health"
perform_get "patients" "$API_BASE/api/patients"
perform_get "dashboard" "$API_BASE/api/dashboard"
perform_get "alerts" "$API_BASE/api/alerts"

# Run POST AI endpoints (sample requests)
perform_post "ai_patient_summary" "$API_BASE/api/ai/patient-summary" '{"PatientId":"P001"}'
perform_post "ai_nurse_brief" "$API_BASE/api/ai/nurse-brief" '{"NurseName":"Emma"}'
# management brief has no body in the demo API
perform_post "ai_management_brief" "$API_BASE/api/ai/management-brief" '{}' 

# Build summary JSON
$PY - <<PY "$RESULTS_TMP" "$OUT_DIR/smoke-summary.json"
import json,sys
infile = sys.argv[1]
outfile = sys.argv[2]
items = []
with open(infile,'r') as f:
    for line in f:
        line=line.strip()
        if not line: continue
        items.append(json.loads(line))
summary = { 'timestamp': __import__('datetime').datetime.utcnow().isoformat() + 'Z', 'results': items }
with open(outfile,'w') as f:
    json.dump(summary, f, indent=2)
print('Saved summary to:', outfile)
PY

# Print table summary
echo
echo "Smoke test results:"
$PY - <<PY "$RESULTS_TMP"
import json,sys
for line in open(sys.argv[1]):
    line=line.strip()
    if not line: continue
    o=json.loads(line)
    print(f"- {o.get('name')}: {o.get('status')} ({o.get('url')})")
PY

exit 0

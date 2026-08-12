# Connected Care Platform — Full-Stack MVP

A runnable MVP inspired by the supplied Connected Care Platform UI. It includes role-based web experiences for Admin, Doctor, Nurse/Care Coordinator, Management, Executive and Emergency Command Center, plus AI-assistance workflows.

> **Important:** This is a product-development MVP, not a HIPAA-compliant production system. Do not use real PHI. Before production, implement formal HIPAA/security controls, BAA/vendor review, auditability, encryption, identity/SSO/MFA, tenant isolation, retention policies, monitoring, penetration testing, disaster recovery, and a regulatory assessment of each clinical feature.

## Stack

- Backend: .NET 8 Minimal API / C#
- Frontend: React + TypeScript + Vite
- UI: CSS with responsive layouts
- AI: provider abstraction with deterministic demo responses; replace `DemoAiService` with your approved enterprise AI provider after privacy/security review
- Storage: in-memory demo repository; PostgreSQL can be introduced behind the repository interface

## Run

### Backend
```bash
cd backend
dotnet run
```
Runs on `http://localhost:5080`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on the Vite URL shown in the terminal.

The frontend expects the API at `http://localhost:5080`.

## Smoke test (demo)
A reusable PowerShell smoke-test script is provided at `scripts\smoke-test.ps1`. It calls key API endpoints (health, patients, dashboard, alerts) and several demo AI endpoints, saving JSON outputs to `./smoke/*.json` and a summary file at `./smoke/smoke-summary.json`.

Usage (Windows PowerShell):

```powershell
# start backend first (and frontend if desired)
cd backend
dotnet run

# in a separate shell run the smoke test
cd ..\scripts
powershell -ExecutionPolicy Bypass -File .\smoke-test.ps1
```

The script exits with code 0 when all endpoints succeed, or non-zero if any request failed. Review the generated files in the `smoke` folder.

## Included AI workflows

- Admin AI Operations Brief
- Doctor AI Patient Summary
- Nurse AI Care Assistant
- Nurse AI Priority Tasks
- Nurse AI Shift Handover
- Nurse AI Documentation Draft
- Management AI Operations Copilot
- AI Incident Summary
- AI Staffing & Workload insight
- AI Report Generator
- Executive AI Brief
- Emergency AI Copilot

All AI outputs are explicitly treated as assistance/recommendations and are not autonomous clinical decisions.

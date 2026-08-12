using System.Collections.Concurrent;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<DemoStore>();
builder.Services.AddSingleton<IAiService, DemoAiService>();
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
app.UseCors();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok", product = "Connected Care Platform", version = "0.1.0" }));

app.MapGet("/api/dashboard", (DemoStore db) => Results.Ok(db.Dashboard()));

// Patients CRUD
app.MapGet("/api/patients", (DemoStore db) => Results.Ok(db.Patients));
app.MapGet("/api/patients/{id}", (string id, DemoStore db) => db.Patients.FirstOrDefault(x => x.Id == id) is { } p ? Results.Ok(p) : Results.NotFound());
app.MapPost("/api/patients", (PatientCreate req, DemoStore db) =>
{
    var id = $"P{(db.Patients.Count + 1).ToString("D3")}";
    var patient = new Patient(id, req.Name ?? "", req.Mrn ?? "", req.Status ?? "", req.Room ?? "", req.Doctor ?? "", req.Nurse ?? "", req.Condition ?? "", req.Priority ?? 1, req.LastEvent ?? "");
    db.Patients.Add(patient);
    return Results.Created($"/api/patients/{id}", patient);
});
app.MapPut("/api/patients/{id}", (string id, PatientUpdate upd, DemoStore db) =>
{
    var idx = db.Patients.FindIndex(x => x.Id == id);
    if (idx < 0) return Results.NotFound();
    var existing = db.Patients[idx];
    var updated = existing with { Name = upd.Name ?? existing.Name, Mrn = upd.Mrn ?? existing.Mrn, Status = upd.Status ?? existing.Status, Room = upd.Room ?? existing.Room, Doctor = upd.Doctor ?? existing.Doctor, Nurse = upd.Nurse ?? existing.Nurse, Condition = upd.Condition ?? existing.Condition, Priority = upd.Priority ?? existing.Priority, LastEvent = upd.LastEvent ?? existing.LastEvent };
    db.Patients[idx] = updated;
    return Results.Ok(updated);
});
app.MapDelete("/api/patients/{id}", (string id, DemoStore db) =>
{
    var removed = db.Patients.FirstOrDefault(x => x.Id == id);
    if (removed is null) return Results.NotFound();
    db.Patients.Remove(removed);
    return Results.Ok();
});

// Care teams CRUD
app.MapGet("/api/careteams", (DemoStore db) => Results.Ok(db.CareTeams));
app.MapPost("/api/careteams", (CareTeamCreate req, DemoStore db) =>
{
    var id = $"CT{(db.CareTeams.Count + 1).ToString("D3")}";
    var ct = new CareTeam(id, req.Name ?? "", req.Department ?? "", req.Members ?? new List<string>(), req.Status ?? "Active");
    db.CareTeams.Add(ct);
    return Results.Created($"/api/careteams/{id}", ct);
});
app.MapPut("/api/careteams/{id}", (string id, CareTeamUpdate upd, DemoStore db) =>
{
    var idx = db.CareTeams.FindIndex(x => x.Id == id);
    if (idx < 0) return Results.NotFound();
    var existing = db.CareTeams[idx];
    var updated = existing with { Name = upd.Name ?? existing.Name, Department = upd.Department ?? existing.Department, Members = upd.Members ?? existing.Members, Status = upd.Status ?? existing.Status };
    db.CareTeams[idx] = updated;
    return Results.Ok(updated);
});
app.MapDelete("/api/careteams/{id}", (string id, DemoStore db) =>
{
    var removed = db.CareTeams.FirstOrDefault(x => x.Id == id);
    if (removed is null) return Results.NotFound();
    db.CareTeams.Remove(removed);
    return Results.Ok();
});

// Doctors CRUD
app.MapGet("/api/doctors", (DemoStore db) => Results.Ok(db.Doctors));
app.MapPost("/api/doctors", (DoctorCreate req, DemoStore db) =>
{
    var id = $"D{(db.Doctors.Count + 1).ToString("D3")}";
    var d = new Doctor(id, req.Name ?? "", req.Specialty ?? "", req.Department ?? "", req.Phone ?? "");
    db.Doctors.Add(d);
    return Results.Created($"/api/doctors/{id}", d);
});
app.MapPut("/api/doctors/{id}", (string id, DoctorUpdate upd, DemoStore db) =>
{
    var idx = db.Doctors.FindIndex(x => x.Id == id);
    if (idx < 0) return Results.NotFound();
    var existing = db.Doctors[idx];
    var updated = existing with { Name = upd.Name ?? existing.Name, Specialty = upd.Specialty ?? existing.Specialty, Department = upd.Department ?? existing.Department, Phone = upd.Phone ?? existing.Phone };
    db.Doctors[idx] = updated;
    return Results.Ok(updated);
});
app.MapDelete("/api/doctors/{id}", (string id, DemoStore db) =>
{
    var removed = db.Doctors.FirstOrDefault(x => x.Id == id);
    if (removed is null) return Results.NotFound();
    db.Doctors.Remove(removed);
    return Results.Ok();
});

// Nurses CRUD
app.MapGet("/api/nurses", (DemoStore db) => Results.Ok(db.Nurses));
app.MapPost("/api/nurses", (NurseCreate req, DemoStore db) =>
{
    var id = $"N{(db.Nurses.Count + 1).ToString("D3")}";
    var n = new Nurse(id, req.Name ?? "", req.Role ?? "", req.Department ?? "", req.Shift ?? "");
    db.Nurses.Add(n);
    return Results.Created($"/api/nurses/{id}", n);
});
app.MapPut("/api/nurses/{id}", (string id, NurseUpdate upd, DemoStore db) =>
{
    var idx = db.Nurses.FindIndex(x => x.Id == id);
    if (idx < 0) return Results.NotFound();
    var existing = db.Nurses[idx];
    var updated = existing with { Name = upd.Name ?? existing.Name, Role = upd.Role ?? existing.Role, Department = upd.Department ?? existing.Department, Shift = upd.Shift ?? existing.Shift };
    db.Nurses[idx] = updated;
    return Results.Ok(updated);
});
app.MapDelete("/api/nurses/{id}", (string id, DemoStore db) =>
{
    var removed = db.Nurses.FirstOrDefault(x => x.Id == id);
    if (removed is null) return Results.NotFound();
    db.Nurses.Remove(removed);
    return Results.Ok();
});

// Locations CRUD
app.MapGet("/api/locations", (DemoStore db) => Results.Ok(db.Locations));
app.MapPost("/api/locations", (LocationCreate req, DemoStore db) =>
{
    var id = $"L{(db.Locations.Count + 1).ToString("D3")}";
    var l = new Location(id, req.Name ?? "", req.Floor ?? "", req.Capacity ?? 0, req.Status ?? "Active");
    db.Locations.Add(l);
    return Results.Created($"/api/locations/{id}", l);
});
app.MapPut("/api/locations/{id}", (string id, LocationUpdate upd, DemoStore db) =>
{
    var idx = db.Locations.FindIndex(x => x.Id == id);
    if (idx < 0) return Results.NotFound();
    var existing = db.Locations[idx];
    var updated = existing with { Name = upd.Name ?? existing.Name, Floor = upd.Floor ?? existing.Floor, Capacity = upd.Capacity ?? existing.Capacity, Status = upd.Status ?? existing.Status };
    db.Locations[idx] = updated;
    return Results.Ok(updated);
});
app.MapDelete("/api/locations/{id}", (string id, DemoStore db) =>
{
    var removed = db.Locations.FirstOrDefault(x => x.Id == id);
    if (removed is null) return Results.NotFound();
    db.Locations.Remove(removed);
    return Results.Ok();
});

// Medication Administration (MAR) - demo endpoints
app.MapGet("/api/mar", (DemoStore db) => Results.Ok(db.Meds));
app.MapGet("/api/mar/{id}", (string id, DemoStore db) => db.Meds.FirstOrDefault(x => x.Id == id) is { } m ? Results.Ok(m) : Results.NotFound());
app.MapPost("/api/mar", (MedCreate req, DemoStore db) =>
{
    var id = $"M{(db.Meds.Count + 1).ToString("D4")}";
    var m = new MedAdministration(id, req.PatientId ?? "", req.Medication ?? "", req.Dose ?? "", req.ScheduledTime ?? "", req.Status ?? "Pending", req.AdministeredBy ?? "", req.AdministeredAt ?? "");
    db.Meds.Add(m);
    return Results.Created($"/api/mar/{id}", m);
});
app.MapPut("/api/mar/{id}", (string id, MedUpdate upd, DemoStore db) =>
{
    var idx = db.Meds.FindIndex(x => x.Id == id);
    if (idx < 0) return Results.NotFound();
    var existing = db.Meds[idx];
    var updated = existing with { Status = upd.Status ?? existing.Status, AdministeredBy = upd.AdministeredBy ?? existing.AdministeredBy, AdministeredAt = upd.AdministeredAt ?? existing.AdministeredAt };
    db.Meds[idx] = updated;
    return Results.Ok(updated);
});

app.MapGet("/api/alerts", (DemoStore db) => Results.Ok(db.Alerts));
app.MapGet("/api/incidents", (DemoStore db) => Results.Ok(db.Incidents));
app.MapGet("/api/staffing", (DemoStore db) => Results.Ok(db.Staffing));
app.MapGet("/api/reports", (DemoStore db) => Results.Ok(db.Reports));

app.MapPost("/api/ai/ask", async (AiAskRequest request, IAiService ai) => Results.Ok(await ai.Ask(request)));
app.MapPost("/api/ai/patient-summary", async (PatientSummaryRequest request, DemoStore db, IAiService ai) =>
{
    var patient = db.Patients.FirstOrDefault(x => x.Id == request.PatientId);
    if (patient is null) return Results.NotFound();
    return Results.Ok(await ai.PatientSummary(patient));
});
app.MapPost("/api/ai/nurse-brief", async (NurseBriefRequest request, DemoStore db, IAiService ai) => Results.Ok(await ai.NurseBrief(db, request)));
app.MapPost("/api/ai/shift-handover", async (ShiftHandoverRequest request, DemoStore db, IAiService ai) => Results.Ok(await ai.ShiftHandover(db, request)));
app.MapPost("/api/ai/documentation-draft", async (DocumentationRequest request, IAiService ai) => Results.Ok(await ai.DocumentationDraft(request)));
app.MapPost("/api/ai/management-brief", async (IAiService ai) => Results.Ok(await ai.ManagementBrief()));
app.MapPost("/api/ai/emergency-copilot", async (IAiService ai) => Results.Ok(await ai.EmergencyCopilot()));
app.MapPost("/api/ai/report", async (ReportRequest request, IAiService ai) => Results.Ok(await ai.Report(request)));

// Simple demo auth (DO NOT use in production)
app.MapPost("/api/auth/login", (LoginRequest req) =>
{
    // demo credentials: admin/password, doctor/password, nurse/password
    var usr = req.Username?.ToLowerInvariant();
    if (usr == "admin" && req.Password == "password") return Results.Ok(new LoginResponse("Admin User","Admin", Guid.NewGuid().ToString()));
    if (usr == "doctor" && req.Password == "password") return Results.Ok(new LoginResponse("Dr. Demo","Doctor", Guid.NewGuid().ToString()));
    if (usr == "nurse" && req.Password == "password") return Results.Ok(new LoginResponse("Nurse Demo","Nurse", Guid.NewGuid().ToString()));
    return Results.Unauthorized();
});

app.Run();

record AiAskRequest(string Role, string Question);
record PatientSummaryRequest(string PatientId);
record NurseBriefRequest(string NurseName = "Emma");
record ShiftHandoverRequest(string NurseName = "Emma");
record DocumentationRequest(string Observation, string Vitals, string Medication, string FollowUp);
record ReportRequest(string Type = "Weekly Operations Report");

record LoginRequest(string Username, string Password);
record LoginResponse(string Name, string Role, string Token);

record Patient(string Id, string Name, string Mrn, string Status, string Room, string Doctor, string Nurse, string Condition, int Priority, string LastEvent);
record PatientCreate(string? Name, string? Mrn, string? Status, string? Room, string? Doctor, string? Nurse, string? Condition, int? Priority, string? LastEvent);
record PatientUpdate(string? Name, string? Mrn, string? Status, string? Room, string? Doctor, string? Nurse, string? Condition, int? Priority, string? LastEvent);

record Alert(string Id, string Time, string Patient, string Severity, string Description, string Status, string Owner);
record Incident(string Id, string Patient, string Severity, string Category, string Status, double AcknowledgementMinutes, string Summary);
record StaffWorkload(string Unit, string Role, int Assigned, int OpenTasks, int AlertCount, int CapacityPercent, string Trend);
record Report(string Id, string Name, string Date, string Type, string Status);

record CareTeam(string Id, string Name, string Department, List<string> Members, string Status);
record CareTeamCreate(string? Name, string? Department, List<string>? Members, string? Status);
record CareTeamUpdate(string? Name, string? Department, List<string>? Members, string? Status);

record Doctor(string Id, string Name, string Specialty, string Department, string Phone);
record DoctorCreate(string? Name, string? Specialty, string? Department, string? Phone);
record DoctorUpdate(string? Name, string? Specialty, string? Department, string? Phone);

record Nurse(string Id, string Name, string Role, string Department, string Shift);
record NurseCreate(string? Name, string? Role, string? Department, string? Shift);
record NurseUpdate(string? Name, string? Role, string? Department, string? Shift);

record Location(string Id, string Name, string Floor, int Capacity, string Status);
record LocationCreate(string? Name, string? Floor, int? Capacity, string? Status);
record LocationUpdate(string? Name, string? Floor, int? Capacity, string? Status);

// Medication administration (MAR) records
record MedAdministration(string Id, string PatientId, string Medication, string Dose, string ScheduledTime, string Status, string AdministeredBy, string AdministeredAt);
record MedCreate(string? PatientId, string? Medication, string? Dose, string? ScheduledTime, string? Status, string? AdministeredBy, string? AdministeredAt);
record MedUpdate(string? Status, string? AdministeredBy, string? AdministeredAt);

record DashboardData(int TotalPatients, int ActiveAlerts, int CriticalAlerts, int CareTeams, int OpenTasks, double MedicationCompliance, double AvgResponseMinutes, List<MetricPoint> AlertTrend, List<UnitInsight> Units);
record MetricPoint(string Label, int Critical, int High, int Medium, int Low);
record UnitInsight(string Unit, string Issue, string Severity, string Value);

record AiResponse(string Title, string Summary, List<string> Insights, List<string> RecommendedActions, List<string> Sources, bool HumanReviewRequired = true);

interface IAiService
{
    Task<AiResponse> Ask(AiAskRequest request);
    Task<AiResponse> PatientSummary(Patient patient);
    Task<AiResponse> NurseBrief(DemoStore db, NurseBriefRequest request);
    Task<AiResponse> ShiftHandover(DemoStore db, ShiftHandoverRequest request);
    Task<AiResponse> DocumentationDraft(DocumentationRequest request);
    Task<AiResponse> ManagementBrief();
    Task<AiResponse> EmergencyCopilot();
    Task<AiResponse> Report(ReportRequest request);
}

sealed class DemoAiService : IAiService
{
    public Task<AiResponse> Ask(AiAskRequest request) => Task.FromResult(new AiResponse(
        "Operations Copilot",
        $"Demo response for {request.Role}: {request.Question}",
        ["The question is being answered from authorized demo operational data.", "No autonomous clinical decision has been made."],
        ["Review the supporting records before acting.", "Use the workflow engine for any approved action."],
        ["Dashboard", "Alerts", "Tasks", "Audit trail"]));

    public Task<AiResponse> PatientSummary(Patient p) => Task.FromResult(new AiResponse(
        "AI Patient Summary",
        $"{p.Name} is currently {p.Status.ToLowerInvariant()} in {p.Room}. The assigned physician is {p.Doctor} and care-team owner is {p.Nurse}.",
        [p.Condition, $"Priority level: {p.Priority}", $"Latest recorded event: {p.LastEvent}"],
        ["Review the recent timeline", "Confirm outstanding care tasks", "Escalate only according to authorized clinical workflow"],
        ["Patient profile", "Recent events", "Care tasks", "Vitals"]));

    public Task<AiResponse> NurseBrief(DemoStore db, NurseBriefRequest r) => Task.FromResult(new AiResponse(
        "AI Care Assistant",
        $"Good morning, {r.NurseName}. Three items are recommended for review based on the demo task and alert queue.",
        ["1 critical alert", "1 overdue medication task", "1 follow-up task"],
        ["Review the critical alert", "Complete the overdue medication task", "Record the pending follow-up"],
        ["Assigned patients", "Medication queue", "Alerts", "Tasks"]));

    public Task<AiResponse> ShiftHandover(DemoStore db, ShiftHandoverRequest r) => Task.FromResult(new AiResponse(
        "AI Shift Handover",
        $"Draft handover for {r.NurseName}: four patients require attention or follow-up.",
        ["Patricia Smith — critical alert reviewed; physician follow-up pending", "Michael Davis — medication follow-up required", "Linda Martinez — routine observation pending", "Robert Johnson — discharge planning in progress"],
        ["Review and edit the handover", "Confirm outstanding tasks", "Share only after authorized nurse review"],
        ["Patient list", "Tasks", "Alerts", "Care notes"]));

    public Task<AiResponse> DocumentationDraft(DocumentationRequest r) => Task.FromResult(new AiResponse(
        "AI Documentation Draft",
        $"Observation: {r.Observation}\nVitals: {r.Vitals}\nMedication: {r.Medication}\nFollow-up: {r.FollowUp}",
        ["This is a draft generated from the supplied inputs.", "Verify accuracy and completeness before saving."],
        ["Edit the draft", "Confirm facts against the source data", "Save only after human review"],
        ["Nurse-entered observation", "Vitals", "Medication", "Follow-up"]));

    public Task<AiResponse> ManagementBrief() => Task.FromResult(new AiResponse(
        "AI Operations Brief",
        "Operations are broadly stable, with three areas recommended for management review.",
        ["Emergency response time increased 14% in the demo trend", "18 care tasks are overdue", "Medication compliance is below target in one unit"],
        ["Review response-time drivers", "Inspect workload in Med-Surg Unit 2", "Review medication workflow exceptions"],
        ["Operations dashboard", "Incidents", "Staff workload", "Medication compliance"]));

    public Task<AiResponse> EmergencyCopilot() => Task.FromResult(new AiResponse(
        "AI Emergency Copilot",
        "Eight active alerts are visible in the demo command center; five are high priority.",
        ["Two alerts require immediate attention", "Three alerts are awaiting response", "Three ambulances are responding", "One alert is approaching an escalation threshold"],
        ["Review unacknowledged critical alerts", "Verify ambulance availability", "Escalate only through configured emergency workflow"],
        ["Live alerts", "Dispatch board", "Ambulance status", "Alert map"]));

    public Task<AiResponse> Report(ReportRequest r) => Task.FromResult(new AiResponse(
        r.Type,
        "Draft report generated from demo operational data.",
        ["12 critical/high incidents reviewed", "92% medication compliance", "4.2 minute average response time"],
        ["Validate metrics", "Add management commentary", "Approve before distribution"],
        ["Dashboard", "Incidents", "Medication", "Response metrics"]));
}

sealed class DemoStore
{
    public List<Patient> Patients { get; } =
    [
        new("P001","Patricia Smith","MRN-10021","Critical","Room 302","Dr. Sarah Wilson","Emma Davis","Heart failure; recent critical alert",5,"Critical alert reviewed; physician follow-up pending"),
        new("P002","Michael Davis","MRN-10022","High","Room 201","Dr. Michael Brown","James Taylor","Post-operative recovery",4,"Medication follow-up required"),
        new("P003","Linda Martinez","MRN-10023","Medium","Room 411","Dr. Sarah Wilson","Emma Davis","Diabetes management",3,"Routine follow-up observation due"),
        new("P004","Robert Johnson","MRN-10024","Stable","Room 105","Dr. Sarah Wilson","Emma Davis","General recovery",1,"Discharge planning in progress"),
        new("P005","Mary Williams","MRN-10025","Stable","Room 210","Dr. Michael Brown","James Taylor","Hypertension",1,"Medication administered"),
        new("P006","James Brown","MRN-10026","Medium","Room 114","Dr. David Lee","Sophia Martinez","Post-surgical monitoring",2,"Vitals recorded")
    ];

    public List<Alert> Alerts { get; } =
    [
        new("A1042","10:30 AM","Patricia Smith","Critical","Critical patient alert; physician review pending","Open","Emma Davis"),
        new("A1041","10:28 AM","Michael Davis","High","Medication follow-up required","Open","James Taylor"),
        new("A1040","10:25 AM","Linda Martinez","Medium","Routine follow-up observation","Open","Emma Davis"),
        new("A1039","10:20 AM","Robert Johnson","Medium","Discharge planning update","Acknowledged","Emma Davis")
    ];

    public List<Incident> Incidents { get; } =
    [
        new("I-1001","Patricia Smith","Critical","Patient Safety","Open",2.1,"Critical alert requiring physician follow-up"),
        new("I-1002","Michael Davis","High","Medication","Open",3.4,"Medication task overdue"),
        new("I-1003","Linda Martinez","Medium","Care Task","Resolved",1.8,"Routine observation completed")
    ];

    public List<StaffWorkload> Staffing { get; } =
    [
        new("Med-Surg Unit 2","Nurse",25,18,124,120,"Increasing"),
        new("ICU","Nurse",12,11,86,110,"Increasing"),
        new("Cardiology Unit","Nurse",18,9,42,85,"Stable"),
        new("Medical Unit","Nurse",16,6,31,68,"Improving")
    ];

    public List<Report> Reports { get; } =
    [
        new("R001","Weekly Operations Report","May 19, 2024","Operations","Ready"),
        new("R002","Patient Safety Summary","May 19, 2024","Safety","Ready"),
        new("R003","Medication Compliance Report","May 19, 2024","Medication","Draft")
    ];

    // Admin lists
    public List<CareTeam> CareTeams { get; } =
    [
        new("CT001","Team A","Cardiology", new List<string>{ "Dr. Sarah Wilson", "Emma Davis" }, "Active"),
        new("CT002","Team B","Med-Surg", new List<string>{ "Dr. Michael Brown", "James Taylor" }, "Active")
    ];

    public List<Doctor> Doctors { get; } =
    [
        new("D001","Dr. Sarah Wilson","Cardiology","Cardiology","(555) 123-4567"),
        new("D002","Dr. Michael Brown","Internal Medicine","Medicine","(555) 234-5678")
    ];

    public List<Nurse> Nurses { get; } =
    [
        new("N001","Emma Davis","Charge Nurse","Cardiology","Day"),
        new("N002","James Taylor","Staff Nurse","Med-Surg","Night")
    ];

    public List<Location> Locations { get; } =
    [
        new("L001","Cardiology Unit","3rd Floor",30,"Active"),
        new("L002","Med-Surg Unit 2","2nd Floor",28,"Active")
    ];

    public List<MedAdministration> Meds { get; } =
    [
        new("M0001","P001","Metoprolol 50 mg","50 mg","08:00 AM","Pending","",""),
        new("M0002","P002","Aspirin 81 mg","81 mg","09:00 AM","Given","Nurse Demo","08:59 AM"),
        new("M0003","P003","Furosemide 20 mg","20 mg","07:30 AM","Pending","","")
    ];

    public DashboardData Dashboard() => new(2350,12,3,45,156,92,4.2,
        [new("12 AM",1,2,1,0),new("4 AM",2,1,2,1),new("8 AM",3,2,2,1),new("12 PM",4,3,2,2),new("4 PM",5,4,2,1),new("8 PM",3,3,2,1)],
        [new("Cardiology Unit","High alert volume + tasks","High","9 alerts"),new("Med-Surg Unit 2","Overdue tasks","High","18 overdue"),new("ICU","Staffing below target","Medium","110% load")]);
}

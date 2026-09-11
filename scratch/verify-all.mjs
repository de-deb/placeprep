const BASE = 'http://localhost:5001';
const FRONTEND_BASE = 'http://localhost:5173';

const results = [];
function record(testName, passed, details = '') {
  results.push({ testName, passed, details });
  console.log(`${passed ? '✓' : '✗'} ${testName} ${details ? '(' + details + ')' : ''}`);
}

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const status = res.status;
  let body = null;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status, body, text };
}

async function run() {
  console.log('--- STARTING PLACEPREP ADMIN SECTION DEEP VERIFICATION ---\n');

  // 1. RBAC: Unauthenticated
  const r1 = await request(`${BASE}/api/admin/overview`);
  record('RBAC: Unauthenticated request to /api/admin/overview returns 401', r1.status === 401, `Status: ${r1.status}`);

  // 2. Auth: Student login
  const r2 = await request(`${BASE}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'student@placeprep.local', password: 'Student@123' })
  });
  const studentToken = r2.body?.data?.token;
  record('Auth: Student login successful', r2.status === 200 && !!studentToken);

  // 3. RBAC: Student forbidden from admin endpoints
  const r3 = await request(`${BASE}/api/admin/overview`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  record('RBAC: Student forbidden from /api/admin/overview returns 403', r3.status === 403, `Status: ${r3.status}`);

  // 4. Auth: Admin login
  const r4 = await request(`${BASE}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@placeprep.local', password: 'Admin@123' })
  });
  const adminToken = r4.body?.data?.token;
  record('Auth: Admin login successful', r4.status === 200 && !!adminToken);

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  // 5. Admin Overview endpoint (200 OK + expected schema)
  const r5 = await request(`${BASE}/api/admin/overview`, { headers: adminHeaders });
  const d5 = r5.body?.data;
  const validOverview = r5.status === 200 && typeof d5?.students === 'number' && typeof d5?.companies === 'number' && typeof d5?.openDrives === 'number';
  record('Admin Overview returns 200 and valid stats payload', validOverview, `Students: ${d5?.students}, Companies: ${d5?.companies}, Drives: ${d5?.openDrives}`);

  // 6. Admin Students List & Search Filter
  const r6 = await request(`${BASE}/api/admin/students`, { headers: adminHeaders });
  const students = r6.body?.data || [];
  const testStudentId = students[0]?.id;
  record('Admin Students: list returns student records', students.length > 0, `Count: ${students.length}`);

  const r6s = await request(`${BASE}/api/admin/students?search=Devananda`, { headers: adminHeaders });
  const matched = r6s.body?.data || [];
  record('Admin Students: search filter works', matched.some(s => s.name.includes('Devananda')), `Matches: ${matched.length}`);

  // 7. Student 360° Detail & 404 Handling
  const r7 = await request(`${BASE}/api/admin/students/${testStudentId}`, { headers: adminHeaders });
  record('Admin Student Detail: returns 360° profile payload', !!r7.body?.data?.readiness, `Name: ${r7.body?.data?.name}`);

  const r7nf = await request(`${BASE}/api/admin/students/nonexistent-student-id-999`, { headers: adminHeaders });
  record('Admin Student Detail: nonexistent ID returns 404', r7nf.status === 404 && r7nf.body?.message === 'Student not found', `Status: ${r7nf.status}, Msg: "${r7nf.body?.message}"`);

  // 8. Companies CRUD with Description
  const stamp = Date.now();
  const testCompanyName = `Test Corp ${stamp}`;
  const testCompanyUpdatedName = `Test Corp Updated ${stamp}`;
  const r8c = await request(`${BASE}/api/companies`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      name: testCompanyName,
      industry: 'Enterprise Cloud',
      website: 'https://testcorp.local',
      description: 'A leading provider of cloud solutions.',
      packageLpa: 14.5,
      eligibilityCgpa: 7.5,
      roles: ['Backend Engineer', 'DevOps'],
      topics: ['DSA', 'System Design'],
      process: 'OA followed by 2 technical rounds.'
    })
  });
  const testCompanyId = r8c.body?.data?.id;
  const descSaved = r8c.body?.data?.description === 'A leading provider of cloud solutions.';
  record('Companies CRUD: Create company with description', r8c.status === 201 && !!testCompanyId && descSaved, `ID: ${testCompanyId}`);

  // Update company
  const r8u = await request(`${BASE}/api/companies/${testCompanyId}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      name: testCompanyUpdatedName,
      description: 'Updated company description.'
    })
  });
  record('Companies CRUD: Update company details', r8u.status === 200 && r8u.body?.data?.description === 'Updated company description.');

  // 9. Drives CRUD + Deadline Clearing + Allowed Branches/Years
  const r9c = await request(`${BASE}/api/drives`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      companyId: testCompanyId,
      title: 'Graduate Cloud Architect 2027',
      date: new Date(Date.now() + 864000000).toISOString(),
      deadline: new Date(Date.now() + 432000000).toISOString(),
      mode: 'On-campus',
      status: 'OPEN',
      minCgpa: 7.5,
      allowedBranches: ['Computer Science', 'AIDS'],
      allowedYears: [3, 4],
      requiredSkills: ['Node.js', 'PostgreSQL']
    })
  });
  const testDriveId = r9c.body?.data?.id;
  const d9 = r9c.body?.data;
  record('Drives CRUD: Create drive with deadline and eligibility rules', r9c.status === 201 && !!testDriveId && d9?.allowedBranches?.length === 2 && d9?.allowedYears?.length === 2);

  // Update drive to clear deadline (deadline: null) and clear allowedBranches (allowedBranches: [])
  const r9u = await request(`${BASE}/api/drives/${testDriveId}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      deadline: null,
      allowedBranches: []
    })
  });
  const updatedDrive = r9u.body?.data;
  const deadlineCleared = updatedDrive?.deadline === null;
  const branchesCleared = Array.isArray(updatedDrive?.allowedBranches) && updatedDrive?.allowedBranches?.length === 0;
  record('Drives CRUD: Clearing deadline (deadline: null) and branches (allowedBranches: [])', r9u.status === 200 && deadlineCleared && branchesCleared, `deadline=${updatedDrive?.deadline}, branches.length=${updatedDrive?.allowedBranches?.length}`);

  // 10. Drive Detail & Applicants & Status History
  const r10a = await request(`${BASE}/api/applications`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ driveId: testDriveId })
  });
  const testAppId = r10a.body?.data?.id;
  record('Drive Applicants: Student applied to test drive', r10a.status === 201 && !!testAppId);

  // Admin inspects drive detail (funnel + applicants)
  const r10d = await request(`${BASE}/api/admin/drives/${testDriveId}`, { headers: adminHeaders });
  const driveDetail = r10d.body?.data;
  const hasApplicant = driveDetail?.applicants?.some(a => a.id === testAppId);
  record('Drive Detail: Returns funnel and applicants list', driveDetail?.totalApplicants >= 1 && hasApplicant);

  // Individual status change
  const r10s = await request(`${BASE}/api/applications/${testAppId}/status`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ status: 'SHORTLISTED', note: 'Qualified CGPA criteria' })
  });
  record('Drive Applicants: Admin updates single applicant status to SHORTLISTED', r10s.status === 200 && r10s.body?.data?.status === 'SHORTLISTED');

  // Verify status history via GET /api/applications/:id
  const r10t = await request(`${BASE}/api/applications/${testAppId}`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const history = r10t.body?.data?.history || [];
  const hasHistory = history.some(h => h.newStatus === 'SHORTLISTED' || h.newStatus === 'APPLIED');
  record('Status History: Application timeline logs status transition', hasHistory, `Entries: ${history.length}`);

  // Bulk status update
  const r10b = await request(`${BASE}/api/applications/bulk-status`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ ids: [testAppId], status: 'ONLINE_ASSESSMENT' })
  });
  record('Bulk Status Update: Admin moves applicants to ONLINE_ASSESSMENT in bulk', r10b.status === 200 && r10b.body?.data?.updated === 1, `Updated: ${r10b.body?.data?.updated}`);

  // 11. Resources CRUD
  const r11c = await request(`${BASE}/api/resources`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      title: 'Top 50 System Design Interview Patterns',
      category: 'Interview',
      type: 'ARTICLE',
      url: 'https://placeprep.local/resources/system-design',
      description: 'Comprehensive guide to modern distributed system patterns.',
      level: 'Advanced',
      tags: ['System Design', 'Scalability'],
      featured: true
    })
  });
  const testResourceId = r11c.body?.data?.id;
  record('Resources CRUD: Create resource', r11c.status === 201 && !!testResourceId);

  const r11u = await request(`${BASE}/api/resources/${testResourceId}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ level: 'Intermediate' })
  });
  record('Resources CRUD: Update resource', r11u.status === 200 && r11u.body?.data?.level === 'Intermediate');

  const r11d = await request(`${BASE}/api/resources/${testResourceId}`, {
    method: 'DELETE',
    headers: adminHeaders
  });
  record('Resources CRUD: Delete resource', r11d.status === 200);

  // 12. Announcements CRUD + Notification Triggering
  const r12c = await request(`${BASE}/api/announcements`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      title: 'Placement Drive Schedule Update — Final Week',
      body: 'All shortlisted candidates please check your interview slots.'
    })
  });
  const testAnnouncementId = r12c.body?.data?.id;
  record('Announcements CRUD: Create announcement', r12c.status === 201 && !!testAnnouncementId);

  // Verify student received a notification for the announcement
  const r12n = await request(`${BASE}/api/notifications`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const notifs = r12n.body?.data?.items || [];
  const received = notifs.some(n => n.title.includes('Placement Drive Schedule Update'));
  record('Notification Behavior: Announcement automatically created notification for students', received, `Total notifications: ${notifs.length}`);

  const r12d = await request(`${BASE}/api/announcements/${testAnnouncementId}`, {
    method: 'DELETE',
    headers: adminHeaders
  });
  record('Announcements CRUD: Delete announcement', r12d.status === 200);

  // 13. Coding Problem Creation & Editing (adminCoding.update)
  const r13c = await request(`${BASE}/api/admin/coding/problems`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      title: 'Verification Test: Invert Binary Tree',
      difficulty: 'Easy',
      tags: ['Tree', 'Recursion'],
      description: 'Given the root of a binary tree, invert the tree and return its root.',
      constraints: 'The number of nodes in the tree is in the range [0, 100].',
      inputFormat: 'Serialized tree array',
      outputFormat: 'Inverted tree array',
      explanation: 'Swap left and right children recursively.',
      hint: 'Think recursively about subtrees.',
      estimatedMinutes: 20,
      companies: ['Google', 'Amazon'],
      executionSupported: true,
      testCases: [
        { input: '[4,2,7,1,3,6,9]', expectedOutput: '[4,7,2,9,6,3,1]', isSample: true, order: 0 },
        { input: '[2,1,3]', expectedOutput: '[2,3,1]', isSample: false, order: 1 }
      ]
    })
  });
  const testProblemId = r13c.body?.data?.id;
  record('Coding Catalog: Create internal problem with test cases', r13c.status === 201 && !!testProblemId);

  // Edit problem using PUT /api/admin/coding/problems/:id
  const r13u = await request(`${BASE}/api/admin/coding/problems/${testProblemId}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      title: 'Verification Test: Invert Binary Tree (Edited)',
      difficulty: 'Medium',
      description: 'Updated problem description with additional constraints.'
    })
  });
  const updatedProblem = r13u.body?.data;
  record('Coding Catalog: Edit problem (PUT /api/admin/coding/problems/:id)', r13u.status === 200 && updatedProblem?.difficulty === 'Medium' && updatedProblem?.title?.includes('(Edited)'));

  // Toggle execution support
  const r13t = await request(`${BASE}/api/admin/coding/problems/${testProblemId}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ executionSupported: false })
  });
  record('Coding Catalog: Toggle executionSupported', r13t.status === 200 && r13t.body?.data?.executionSupported === false);

  // Clean up problem
  const r13d = await request(`${BASE}/api/admin/coding/problems/${testProblemId}`, {
    method: 'DELETE',
    headers: adminHeaders
  });
  record('Coding Catalog: Delete problem', r13d.status === 200);

  // Clean up test drive and company
  if (testDriveId) {
    const rdc = await request(`${BASE}/api/drives/${testDriveId}`, { method: 'DELETE', headers: adminHeaders });
    record('Cleanup: Test drive deleted', rdc.status === 200);
  }
  if (testCompanyId) {
    const rcc = await request(`${BASE}/api/companies/${testCompanyId}`, { method: 'DELETE', headers: adminHeaders });
    record('Cleanup: Test company deleted', rcc.status === 200);
  }

  // 14. Frontend Direct / Deep URLs (Nginx SPA serving)
  const deepUrls = [
    '/admin',
    '/admin/students',
    `/admin/students/${testStudentId || '1'}`,
    '/admin/companies',
    '/admin/drives',
    '/admin/coding',
    '/admin/resources',
    '/admin/announcements'
  ];

  for (const path of deepUrls) {
    const rf = await request(`${FRONTEND_BASE}${path}`);
    record(`Frontend Route: ${path} serves index.html (200 OK)`, rf.status === 200 && rf.text.includes('<div id="root">'));
  }

  console.log('\n--- VERIFICATION SUMMARY ---');
  const passedCount = results.filter(r => r.passed).length;
  console.log(`Total: ${results.length} checks, Passed: ${passedCount}, Failed: ${results.length - passedCount}`);
  if (passedCount === results.length) {
    console.log('ALL VERIFICATION CHECKS PASSED PERFECTLY!');
  } else {
    process.exitCode = 1;
  }
}

run().catch(err => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password";
import { COMPLEXITY, LANGUAGES, STARTERS, TEST_CASES } from "./seed-judge-data";

const prisma = new PrismaClient();
const day = 86400000;
const inDays = (d: number) => new Date(Date.now() + d * day);

async function main() {
  const adminPass = await hashPassword("Admin@123");
  const studentPass = await hashPassword("Student@123");

  const admin = await prisma.user.upsert({
    where: { email: "admin@placeprep.local" },
    update: {},
    create: { name: "Placement Admin", email: "admin@placeprep.local", passwordHash: adminPass, role: "ADMIN" },
  });

  // Demo student (primary login) with a rich profile.
  const student = await prisma.user.upsert({
    where: { email: "student@placeprep.local" },
    update: {},
    create: {
      name: "Devananda",
      email: "student@placeprep.local",
      passwordHash: studentPass,
      role: "STUDENT",
      profile: {
        create: {
          cgpa: 8.4, branch: "Computer Science", year: 3,
          skills: ["JavaScript", "TypeScript", "React", "DSA", "SQL", "DBMS"],
          phone: "98765 43210", location: "Chennai",
          college: "VIT Chennai", degree: "B.Tech", graduationYear: 2027,
          github: "https://github.com/devananda", linkedin: "https://linkedin.com/in/devananda",
          portfolio: "https://devananda.dev",
          resumeHeadline: "B.Tech CSE '27 | Full-stack learner",
        },
      },
    },
  });
  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {
      phone: "98765 43210", location: "Chennai", college: "VIT Chennai", degree: "B.Tech",
      graduationYear: 2027, github: "https://github.com/devananda",
      linkedin: "https://linkedin.com/in/devananda", portfolio: "https://devananda.dev",
      skills: ["JavaScript", "TypeScript", "React", "DSA", "SQL", "DBMS"],
    },
    create: { userId: student.id, cgpa: 8.4, branch: "Computer Science", year: 3, skills: ["JavaScript"] },
  });

  // 10 more students across branches/years/CGPA for admin analytics.
  const cohort: { name: string; email: string; cgpa: number; branch: string; year: number; skills: string[] }[] = [
    { name: "Aarav Sharma", email: "aarav@placeprep.local", cgpa: 9.1, branch: "Computer Science", year: 4, skills: ["Java", "DSA", "System Design", "SQL"] },
    { name: "Priya Nair", email: "priya@placeprep.local", cgpa: 8.8, branch: "AIDS", year: 3, skills: ["Python", "ML", "SQL", "Statistics"] },
    { name: "Rahul Verma", email: "rahul@placeprep.local", cgpa: 7.4, branch: "ECE", year: 3, skills: ["C", "Embedded", "Python"] },
    { name: "Sneha Iyer", email: "sneha@placeprep.local", cgpa: 8.2, branch: "Computer Science", year: 2, skills: ["JavaScript", "React"] },
    { name: "Karthik Menon", email: "karthik@placeprep.local", cgpa: 6.8, branch: "Mechanical", year: 4, skills: ["CAD", "Python"] },
    { name: "Divya Rao", email: "divya@placeprep.local", cgpa: 9.4, branch: "AIDS", year: 4, skills: ["Python", "Deep Learning", "DSA", "SQL", "MLOps"] },
    { name: "Arjun Patel", email: "arjun@placeprep.local", cgpa: 7.9, branch: "Computer Science", year: 3, skills: ["Go", "DSA", "Docker", "PostgreSQL"] },
    { name: "Meera Krishnan", email: "meera@placeprep.local", cgpa: 8.6, branch: "ECE", year: 4, skills: ["C++", "DSA", "Computer Networks"] },
    { name: "Vikram Singh", email: "vikram@placeprep.local", cgpa: 7.1, branch: "Civil", year: 3, skills: ["AutoCAD"] },
    { name: "Ananya Das", email: "ananya@placeprep.local", cgpa: 8.9, branch: "Computer Science", year: 4, skills: ["TypeScript", "React", "Node.js", "AWS", "DSA"] },
  ];
  const students = [student];
  for (const c of cohort) {
    const u = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: { name: c.name, email: c.email, passwordHash: studentPass, role: "STUDENT" },
    });
    await prisma.studentProfile.upsert({
      where: { userId: u.id },
      update: {},
      create: { userId: u.id, cgpa: c.cgpa, branch: c.branch, year: c.year, skills: c.skills, college: "VIT Chennai", degree: "B.Tech", graduationYear: 2027 },
    });
    students.push(u);
  }

  // Companies (9).
  const companies = [
    { name: "TCS", industry: "IT Services", website: "https://www.tcs.com", description: "Tata Consultancy Services — large-scale IT services recruiter.", packageLpa: 7.2, eligibilityCgpa: 6.0, roles: ["Software Developer", "System Engineer"], process: "Online Assessment → Technical Interview → HR", topics: ["Arrays", "OOPs", "SQL", "Aptitude"] },
    { name: "Infosys", industry: "IT Services", website: "https://www.infosys.com", description: "Infosys campus recruitment with focus on problem solving.", packageLpa: 6.5, eligibilityCgpa: 6.0, roles: ["System Engineer", "Power Programmer"], process: "Aptitude + Technical MCQ → Technical HR → HR", topics: ["Arrays", "DBMS", "OOPs"] },
    { name: "Zoho", industry: "Product", website: "https://www.zoho.com", description: "Product company with deep programming rounds.", packageLpa: 12.0, eligibilityCgpa: 7.0, roles: ["Software Developer"], process: "Programming Round → Advanced Programming → HR", topics: ["Arrays", "Strings", "DSA"] },
    { name: "Wipro", industry: "IT Services", website: "https://www.wipro.com", description: "Wipro NLTH and Elite hiring.", packageLpa: 6.0, eligibilityCgpa: 6.0, roles: ["Project Engineer"], process: "Aptitude → Coding → Interview", topics: ["Aptitude", "Arrays", "Communication"] },
    { name: "Accenture", industry: "Consulting + Tech", website: "https://www.accenture.com", description: "Accenture Advanced Technology Centers hiring.", packageLpa: 8.2, eligibilityCgpa: 6.5, roles: ["Associate Software Engineer"], process: "Cognitive + Coding → Communication → Interview", topics: ["Arrays", "Cloud basics", "DSA"] },
    { name: "Amazon", industry: "Product", website: "https://www.amazon.jobs", description: "High-bar product hiring: DSA depth + Leadership Principles.", packageLpa: 28.0, eligibilityCgpa: 7.5, roles: ["SDE-1"], process: "Online Assessment → 3 Technical Rounds → Bar Raiser", topics: ["Arrays", "Trees", "Graphs", "Dynamic Programming"] },
    { name: "Microsoft", industry: "Product", website: "https://careers.microsoft.com", description: "Product hiring with DSA + design fundamentals.", packageLpa: 24.0, eligibilityCgpa: 7.5, roles: ["Software Engineer"], process: "OA → Technical Interviews → AA Round", topics: ["Arrays", "Strings", "Trees", "System Design"] },
    { name: "Flipkart", industry: "E-commerce", website: "https://www.flipkartcareers.com", description: "Scale-focused interviews: DSA + machine coding.", packageLpa: 20.0, eligibilityCgpa: 7.0, roles: ["SDE-1", "UI Engineer"], process: "Coding Round → Machine Coding → Interviews", topics: ["Arrays", "HashMap", "Design"] },
    { name: "Cognizant", industry: "IT Services", website: "https://www.cognizant.com", description: "GenC/GenC Pro hiring across roles.", packageLpa: 5.4, eligibilityCgpa: 6.0, roles: ["GenC Developer"], process: "Aptitude → Technical → HR", topics: ["Aptitude", "SQL", "OOPs"] },
  ];
  for (const c of companies) {
    await prisma.company.upsert({ where: { name: c.name }, update: { topics: c.topics }, create: c });
  }
  const byName = async (n: string) => prisma.company.findUniqueOrThrow({ where: { name: n } });
  const tcs = await byName("TCS");
  const zoho = await byName("Zoho");
  const infosys = await byName("Infosys");
  const amazon = await byName("Amazon");
  const cognizant = await byName("Cognizant");
  const flipkart = await byName("Flipkart");

  // Drives (9) with structured eligibility.
  const drives = [
    { companyId: tcs.id, title: "TCS Ninja — 2027 Batch", date: inDays(14), deadline: inDays(10), location: "Chennai", mode: "On-campus", eligibility: "CGPA ≥ 6.0, no active backlogs", minCgpa: 6.0, allowedBranches: [] as string[], allowedYears: [3, 4], requiredSkills: [] as string[], description: "National qualifier hiring for Ninja role.", status: "OPEN" },
    { companyId: zoho.id, title: "Zoho Software Developer — Off Campus", date: inDays(2), deadline: inDays(1), location: "Chennai", mode: "Off-campus", eligibility: "CGPA ≥ 7.0, strong DSA", minCgpa: 7.0, allowedBranches: ["Computer Science", "AIDS"], allowedYears: [3, 4], requiredSkills: ["DSA"], description: "Programming-heavy process.", status: "OPEN" },
    { companyId: infosys.id, title: "Infosys System Engineer", date: inDays(30), deadline: inDays(25), location: "Mysuru", mode: "On-campus", eligibility: "CGPA ≥ 6.0", minCgpa: 6.0, allowedBranches: [] as string[], allowedYears: [4], requiredSkills: [] as string[], description: "Entry-level engineering role.", status: "UPCOMING" },
    { companyId: amazon.id, title: "Amazon SDE Intern — 2027", date: inDays(21), deadline: inDays(2), location: "Bengaluru", mode: "Off-campus", eligibility: "CGPA ≥ 7.5, DSA + Java/Python", minCgpa: 7.5, allowedBranches: ["Computer Science", "AIDS", "ECE"], allowedYears: [3], requiredSkills: ["DSA"], description: "Summer intern hiring.", status: "OPEN" },
    { companyId: cognizant.id, title: "Cognizant GenC — 2027 Batch", date: inDays(45), deadline: inDays(40), location: "Chennai", mode: "On-campus", eligibility: "CGPA ≥ 6.0, all branches", minCgpa: 6.0, allowedBranches: [] as string[], allowedYears: [3, 4], requiredSkills: [] as string[], description: "Mass hiring drive.", status: "UPCOMING" },
    { companyId: flipkart.id, title: "Flipkart SDE-1 — PPO Track", date: inDays(-10), deadline: inDays(-12), location: "Bengaluru", mode: "Off-campus", eligibility: "CGPA ≥ 7.0", minCgpa: 7.0, allowedBranches: [] as string[], allowedYears: [4], requiredSkills: [] as string[], description: "Closed PPO-track drive (for funnel analytics).", status: "CLOSED" },
    { companyId: tcs.id, title: "TCS Digital — Upgrade Round", date: inDays(7), deadline: inDays(5), location: "Chennai", mode: "On-campus", eligibility: "CGPA ≥ 7.0 + Ninja offer", minCgpa: 7.0, allowedBranches: [] as string[], allowedYears: [4], requiredSkills: [] as string[], description: "Upgrade interviews for Ninja selects.", status: "OPEN" },
    { companyId: amazon.id, title: "Amazon SDE-1 — Full Time", date: inDays(60), deadline: inDays(50), location: "Hyderabad", mode: "Off-campus", eligibility: "2026 batch, CGPA ≥ 7.5", minCgpa: 7.5, allowedBranches: ["Computer Science", "AIDS"], allowedYears: [4], requiredSkills: ["DSA", "System Design"], description: "Full-time product role.", status: "UPCOMING" },
    { companyId: infosys.id, title: "Infosys Power Programmer", date: inDays(12), deadline: inDays(9), location: "Remote", mode: "Remote", eligibility: "CGPA ≥ 7.0, strong coders", minCgpa: 7.0, allowedBranches: [] as string[], allowedYears: [3, 4], requiredSkills: ["DSA"], description: "Higher-package coding track.", status: "OPEN" },
  ];
  const driveRows: { id: string; title: string }[] = [];
  for (const d of drives) {
    const existing = await prisma.drive.findFirst({ where: { title: d.title } });
    driveRows.push(existing ?? (await prisma.drive.create({ data: d })));
  }

  // Applications with realistic statuses + history (demo student first).
  const apply = async (userId: string, driveTitle: string, status: string, daysAgo: number) => {
    const drive = driveRows.find((d) => d.title === driveTitle)!;
    const existing = await prisma.application.findUnique({ where: { userId_driveId: { userId, driveId: drive.id } } });
    const app = existing ?? (await prisma.application.create({
      data: { userId, driveId: drive.id, status: "APPLIED", appliedAt: new Date(Date.now() - daysAgo * day) },
    }));
    if (app.status !== status) {
      await prisma.application.update({ where: { id: app.id }, data: { status } });
      await prisma.applicationStatusHistory.create({
        data: { applicationId: app.id, oldStatus: "APPLIED", newStatus: status, changedById: admin.id, note: "Seeded pipeline state" },
      });
    }
    return app;
  };
  await apply(student.id, "TCS Ninja — 2027 Batch", "SHORTLISTED", 4);
  await apply(student.id, "Zoho Software Developer — Off Campus", "APPLIED", 1);
  const plan: [number, string, string][] = [
    [1, "TCS Ninja — 2027 Batch", "SELECTED"], [1, "Flipkart SDE-1 — PPO Track", "REJECTED"],
    [2, "Amazon SDE Intern — 2027", "INTERVIEW"], [2, "TCS Ninja — 2027 Batch", "APPLIED"],
    [3, "Cognizant GenC — 2027 Batch", "APPLIED"],
    [5, "Flipkart SDE-1 — PPO Track", "SELECTED"],
    [6, "Amazon SDE Intern — 2027", "ONLINE_ASSESSMENT"], [6, "TCS Ninja — 2027 Batch", "SHORTLISTED"],
    [7, "TCS Ninja — 2027 Batch", "REJECTED"],
    [9, "Amazon SDE Intern — 2027", "SHORTLISTED"], [9, "Infosys Power Programmer", "APPLIED"],
  ];
  for (const [si, title, status] of plan) {
    try { await apply(students[si].id, title, status, 6); } catch { /* keep seed idempotent */ }
  }

  // Resume for the demo student.
  const resume = await prisma.resume.upsert({ where: { userId: student.id }, update: {}, create: { userId: student.id, summary: "B.Tech CSE student focused on full-stack development and DSA. Built 3+ projects with React, Node.js and PostgreSQL. Seeking SDE internships for 2027." } });
  const hasProjects = await prisma.resumeProject.count({ where: { resumeId: resume.id } });
  if (hasProjects === 0) {
    await prisma.resumeProject.createMany({
      data: [
        { resumeId: resume.id, title: "PlacePrep Tracker", description: "Placement preparation dashboard with readiness analytics.", technologies: ["React", "Node.js", "PostgreSQL"], githubUrl: "https://github.com/devananda/placeprep", liveUrl: "", startDate: "Jan 2026", endDate: "Present" },
        { resumeId: resume.id, title: "Campus Eats", description: "Food ordering app for campus vendors with live order tracking.", technologies: ["React", "Express", "MongoDB"], githubUrl: "https://github.com/devananda/campus-eats", liveUrl: "https://campus-eats.dev", startDate: "Aug 2025", endDate: "Dec 2025" },
      ],
    });
    await prisma.resumeExperience.create({
      data: { resumeId: resume.id, company: "Startup XYZ", role: "Frontend Intern", startDate: "May 2025", endDate: "Jul 2025", description: "Shipped dashboard features used by 2,000+ students.", technologies: ["React", "TypeScript"] },
    });
    await prisma.resumeAchievement.create({
      data: { resumeId: resume.id, title: "Smart India Hackathon Finalist", description: "Top 10 of 300+ teams in the education track.", date: "2025" },
    });
    await prisma.resumeCertification.create({
      data: { resumeId: resume.id, name: "AWS Cloud Practitioner", issuer: "Amazon Web Services", date: "2025", credentialUrl: "" },
    });
  }

  // Coding problems (12) with practice-mode fields.
  const problems = [
    { title: "Two Sum", difficulty: "Easy", tags: ["Arrays", "HashMap"], description: "Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.", hint: "Use a hash map to store complements.", constraints: "2 ≤ nums.length ≤ 10⁴", inputFormat: "First line n, second line n integers, third line target.", outputFormat: "Two space-separated indices.", sampleInput: "4\n2 7 11 15\n9", sampleOutput: "0 1", explanation: "Store each value's index; for x check if target−x was seen.", estimatedMinutes: 15, companies: ["Amazon", "Microsoft", "TCS"] },
    { title: "Valid Parentheses", difficulty: "Easy", tags: ["Stack", "Strings"], description: "Given a string s containing just the characters '()[]{}', determine if the input string is valid.", hint: "Push opening brackets, match on closing.", constraints: "1 ≤ s.length ≤ 10⁴", inputFormat: "A single string s.", outputFormat: "true or false.", sampleInput: "()[]{}", sampleOutput: "true", explanation: "Stack-based matching in O(n).", estimatedMinutes: 15, companies: ["Zoho", "Microsoft"] },
    { title: "Best Time to Buy and Sell Stock", difficulty: "Easy", tags: ["Arrays"], description: "Find the maximum profit from one transaction.", hint: "Track minimum price so far.", constraints: "1 ≤ prices.length ≤ 10⁵", inputFormat: "n followed by n prices.", outputFormat: "Maximum profit.", sampleInput: "6\n7 1 5 3 6 4", sampleOutput: "5", explanation: "One pass: profit = max(price − minSoFar).", estimatedMinutes: 20, companies: ["Amazon", "Flipkart"] },
    { title: "Merge Intervals", difficulty: "Medium", tags: ["Arrays", "Sorting"], description: "Given an array of intervals, merge all overlapping intervals.", hint: "Sort by start, then sweep.", constraints: "1 ≤ intervals.length ≤ 10⁴", inputFormat: "n, then n lines of start end.", outputFormat: "Merged intervals.", sampleInput: "4\n1 3\n2 6\n8 10\n15 18", sampleOutput: "1 6\n8 10\n15 18", explanation: "Sort + linear merge.", estimatedMinutes: 25, companies: ["Microsoft", "Amazon"] },
    { title: "LRU Cache", difficulty: "Hard", tags: ["Design", "HashMap"], description: "Design a data structure that follows LRU cache constraints.", hint: "Hash map + doubly linked list.", constraints: "1 ≤ capacity ≤ 3000", inputFormat: "Operations sequence.", outputFormat: "GET results.", sampleInput: "put 1 1, put 2 2, get 1", sampleOutput: "1", explanation: "O(1) get/put with map + list.", estimatedMinutes: 45, companies: ["Amazon", "Flipkart", "Microsoft"] },
    { title: "Number of Islands", difficulty: "Medium", tags: ["Graphs", "BFS"], description: "Count islands in a 2D grid of '1's and '0's.", hint: "DFS/BFS flood fill.", constraints: "1 ≤ m,n ≤ 300", inputFormat: "m n, then grid.", outputFormat: "Island count.", sampleInput: "4 5\n11110\n11010\n11000\n00000", sampleOutput: "1", explanation: "Flood-fill each unvisited '1'.", estimatedMinutes: 30, companies: ["Amazon", "Microsoft"] },
    { title: "Reverse a Linked List", difficulty: "Easy", tags: ["Linked List"], description: "Reverse a singly linked list iteratively.", hint: "Three pointers: prev, curr, next.", constraints: "0 ≤ nodes ≤ 5000", inputFormat: "n then n values.", outputFormat: "Reversed list.", sampleInput: "5\n1 2 3 4 5", sampleOutput: "5 4 3 2 1", explanation: "Rewire next pointers in one pass.", estimatedMinutes: 15, companies: ["Zoho", "TCS"] },
    { title: "Binary Tree Inorder Traversal", difficulty: "Easy", tags: ["Trees"], description: "Return inorder traversal of a binary tree.", hint: "Left → root → right, recursion or stack.", constraints: "0 ≤ nodes ≤ 100", inputFormat: "Level-order array.", outputFormat: "Inorder sequence.", sampleInput: "1 null 2 3", sampleOutput: "1 3 2", explanation: "Classic DFS order.", estimatedMinutes: 15, companies: ["Amazon", "Microsoft"] },
    { title: "Longest Substring Without Repeating Characters", difficulty: "Medium", tags: ["Strings", "HashMap", "Sliding Window"], description: "Length of the longest substring without repeating characters.", hint: "Sliding window + last-seen map.", constraints: "0 ≤ s.length ≤ 5×10⁴", inputFormat: "A string s.", outputFormat: "Length.", sampleInput: "abcabcbb", sampleOutput: "3", explanation: "Expand right, shrink past duplicates.", estimatedMinutes: 30, companies: ["Amazon", "Flipkart", "Zoho"] },
    { title: "0/1 Knapsack", difficulty: "Medium", tags: ["Dynamic Programming"], description: "Maximize value within capacity picking each item at most once.", hint: "dp[i][w] = max(skip, take).", constraints: "1 ≤ n,W ≤ 100", inputFormat: "n W, weights, values.", outputFormat: "Maximum value.", sampleInput: "3 4\n4 5 1\n1 2 3", sampleOutput: "3", explanation: "2D DP over items × capacity.", estimatedMinutes: 35, companies: ["Amazon"] },
    { title: "Median of Two Sorted Arrays", difficulty: "Hard", tags: ["Arrays", "Binary Search"], description: "Median of two sorted arrays in O(log(m+n)).", hint: "Binary search the partition.", constraints: "0 ≤ m,n ≤ 1000", inputFormat: "Two sorted arrays.", outputFormat: "Median.", sampleInput: "1 3\n2", sampleOutput: "2.0", explanation: "Partition both arrays at the middle.", estimatedMinutes: 50, companies: ["Microsoft", "Amazon"] },
    { title: "Detect Cycle in Directed Graph", difficulty: "Medium", tags: ["Graphs", "DFS"], description: "Return true if a directed graph has a cycle.", hint: "DFS colors: white/gray/black.", constraints: "1 ≤ V ≤ 10⁴", inputFormat: "V E, then edges.", outputFormat: "true or false.", sampleInput: "2 2\n0 1\n1 0", sampleOutput: "true", explanation: "Back edge to a gray node = cycle.", estimatedMinutes: 30, companies: ["Amazon", "Flipkart"] },
  ];
  for (const p of problems) {
    const existing = await prisma.codingProblem.findFirst({ where: { title: p.title } });
    if (existing) await prisma.codingProblem.update({ where: { id: existing.id }, data: p });
    else await prisma.codingProblem.create({ data: p });
  }

  // Demo student progress: 3 solved, 2 bookmarked, attempts.
  const twoSum = await prisma.codingProblem.findFirstOrThrow({ where: { title: "Two Sum" } });
  const valid = await prisma.codingProblem.findFirstOrThrow({ where: { title: "Valid Parentheses" } });
  const stock = await prisma.codingProblem.findFirstOrThrow({ where: { title: "Best Time to Buy and Sell Stock" } });
  const merge = await prisma.codingProblem.findFirstOrThrow({ where: { title: "Merge Intervals" } });
  for (const [prob, solved, marked] of [[twoSum, true, true], [valid, true, false], [stock, true, false], [merge, false, true]] as const) {
    await prisma.codingProgress.upsert({
      where: { userId_problemId: { userId: student.id, problemId: prob.id } },
      update: { solved, bookmarked: marked },
      create: { userId: student.id, problemId: prob.id, solved, bookmarked: marked },
    });
  }
  if ((await prisma.codingAttempt.count({ where: { userId: student.id } })) === 0) {
    await prisma.codingAttempt.createMany({
      data: [
        { userId: student.id, problemId: twoSum.id, verdict: "SOLVED", note: "Hash map approach" },
        { userId: student.id, problemId: valid.id, verdict: "SOLVED" },
        { userId: student.id, problemId: merge.id, verdict: "ATTEMPTED", note: "Forgot to sort first" },
      ],
    });
  }

  // Aptitude questions (20) with difficulty + topic.
  const aq = await prisma.aptitudeQuestion.count();
  if (aq < 20) {
    await prisma.aptitudeQuestion.deleteMany({});
    await prisma.aptitudeQuestion.createMany({
      data: [
        { category: "Quantitative", topic: "Percentages", difficulty: "Easy", question: "If 15% of x is 45, what is x?", options: ["250", "300", "320", "280"], answerIndex: 1, explanation: "x = 45 / 0.15 = 300." },
        { category: "Quantitative", topic: "Speed & Distance", difficulty: "Easy", question: "A train 240m long crosses a pole in 12s. Speed in km/h?", options: ["54", "60", "72", "48"], answerIndex: 2, explanation: "240/12 = 20 m/s = 72 km/h." },
        { category: "Quantitative", topic: "Averages", difficulty: "Easy", question: "Average of first 10 even numbers?", options: ["10", "11", "12", "9"], answerIndex: 1, explanation: "Sum 110 / 10 = 11." },
        { category: "Quantitative", topic: "Time & Work", difficulty: "Medium", question: "A does a job in 12 days, B in 15 days. Together?", options: ["6.67 days", "7 days", "6 days", "7.5 days"], answerIndex: 0, explanation: "1/(1/12+1/15) = 20/3 ≈ 6.67." },
        { category: "Quantitative", topic: "Probability", difficulty: "Medium", question: "P(sum 9) with two dice?", options: ["1/9", "1/6", "5/36", "1/12"], answerIndex: 0, explanation: "4 favourable of 36 = 1/9." },
        { category: "Quantitative", topic: "Permutations", difficulty: "Hard", question: "Ways to arrange 5 books with 2 fixed together?", options: ["24", "48", "120", "12"], answerIndex: 1, explanation: "Treat pair as one: 4! × 2 = 48." },
        { category: "Quantitative", topic: "Interest", difficulty: "Medium", question: "CI on ₹10,000 at 10% for 2 years?", options: ["₹2,000", "₹2,100", "₹2,110", "₹2,010"], answerIndex: 1, explanation: "10000×1.1² − 10000 = 2100." },
        { category: "Logical", topic: "Odd One Out", difficulty: "Easy", question: "Odd one out: Apple, Mango, Banana, Potato", options: ["Apple", "Mango", "Banana", "Potato"], answerIndex: 3, explanation: "Potato is a vegetable." },
        { category: "Logical", topic: "Coding-Decoding", difficulty: "Easy", question: "If BOOK is 43, PEN is?", options: ["33", "35", "37", "32"], answerIndex: 1, explanation: "Letter sums: 43 vs 35." },
        { category: "Logical", topic: "Series", difficulty: "Medium", question: "Next: 2, 6, 12, 20, 30, ?", options: ["40", "42", "44", "36"], answerIndex: 1, explanation: "n(n+1): 6×7 = 42." },
        { category: "Logical", topic: "Blood Relations", difficulty: "Medium", question: "A is B's brother. B is C's mother. A is C's?", options: ["Father", "Uncle", "Brother", "Son"], answerIndex: 1, explanation: "Mother's brother = uncle." },
        { category: "Logical", topic: "Syllogisms", difficulty: "Hard", question: "All cats are animals. Some animals are black. Conclusion?", options: ["Some cats are black", "No conclusion", "All black are cats", "Some animals are cats"], answerIndex: 1, explanation: "Middle term undistributed — no valid conclusion." },
        { category: "Logical", topic: "Directions", difficulty: "Easy", question: "Face north, turn right, then right again. Facing?", options: ["North", "South", "East", "West"], answerIndex: 1, explanation: "Two right turns = U-turn." },
        { category: "Verbal", topic: "Synonyms", difficulty: "Easy", question: "Synonym of 'Abundant'?", options: ["Scarce", "Plentiful", "Rare", "Meagre"], answerIndex: 1, explanation: "Abundant = plentiful." },
        { category: "Verbal", topic: "Antonyms", difficulty: "Easy", question: "Antonym of 'Transparent'?", options: ["Clear", "Opaque", "Obvious", "Frank"], answerIndex: 1, explanation: "Opposite is opaque." },
        { category: "Verbal", topic: "Spelling", difficulty: "Easy", question: "Correctly spelt word:", options: ["Occassion", "Occasion", "Ocassion", "Ocasion"], answerIndex: 1, explanation: "Occasion." },
        { category: "Verbal", topic: "Idioms", difficulty: "Medium", question: "'To bite the dust' means?", options: ["Eat quickly", "Suffer defeat", "Work hard", "Stay hidden"], answerIndex: 1, explanation: "To fail / be defeated." },
        { category: "Verbal", topic: "Para Jumbles", difficulty: "Hard", question: "First sentence of a paragraph on climate?", options: ["However, others disagree", "Climate shapes civilizations", "Therefore we must act", "For example, Rome fell"], answerIndex: 1, explanation: "General statement opens the theme." },
        { category: "Verbal", topic: "Reading Comprehension", difficulty: "Medium", question: "Author's tone in a balanced review passage?", options: ["Biased", "Neutral", "Sarcastic", "Hostile"], answerIndex: 1, explanation: "Presents both sides = neutral." },
        { category: "Quantitative", topic: "Ratios", difficulty: "Easy", question: "Divide 60 in ratio 2:3.", options: ["20, 40", "24, 36", "30, 30", "15, 45"], answerIndex: 1, explanation: "2/5×60=24, 3/5×60=36." },
      ],
    });
  }
  if ((await prisma.quizAttempt.count({ where: { userId: student.id } })) === 0) {
    await prisma.quizAttempt.createMany({
      data: [
        { userId: student.id, category: "Quantitative", difficulty: "Easy", score: 3, total: 5, timeTakenSeconds: 420, takenAt: new Date(Date.now() - 5 * day) },
        { userId: student.id, category: "Logical", difficulty: "Easy", score: 4, total: 5, timeTakenSeconds: 380, takenAt: new Date(Date.now() - 2 * day) },
        { userId: student.id, category: "Verbal", difficulty: "Medium", score: 2, total: 5, timeTakenSeconds: 500, takenAt: new Date(Date.now() - 1 * day) },
      ],
    });
  }

  // Interview bank (27 questions, 9 categories).
  if ((await prisma.interviewQuestion.count()) === 0) {
    const bank: { category: string; difficulty: string; question: string; guidance: string; keyPoints: string[]; companies: string[] }[] = [
      { category: "HR", difficulty: "Easy", question: "Tell me about yourself.", guidance: "60–90 seconds: education → skills → standout project → why this role. End looking forward, not backward.", keyPoints: ["Keep it under 90 seconds", "Lead with strengths", "End with role fit"], companies: ["TCS", "Infosys", "Wipro"] },
      { category: "HR", difficulty: "Easy", question: "Why should we hire you?", guidance: "Map 2–3 of your proof points to the job description. Evidence beats adjectives.", keyPoints: ["Use STAR examples", "Match the JD", "Show, don't claim"], companies: ["TCS", "Cognizant"] },
      { category: "HR", difficulty: "Medium", question: "Describe a conflict in a team project and how you resolved it.", guidance: "Pick a real disagreement about approach, not people. Show listening, data, compromise.", keyPoints: ["STAR format", "Focus on outcome", "Own your part"], companies: ["Amazon", "Microsoft"] },
      { category: "OOP", difficulty: "Easy", question: "Explain the four pillars of OOP with examples.", guidance: "Encapsulation, Abstraction, Inheritance, Polymorphism — one crisp Java/C++ example each.", keyPoints: ["One example per pillar", "Mention access modifiers", "Real vs interface distinction"], companies: ["TCS", "Infosys", "Zoho"] },
      { category: "OOP", difficulty: "Medium", question: "Abstract class vs interface — when would you use each?", guidance: "State + partial implementation vs pure contract; multiple inheritance angle; Java 8 default methods nuance.", keyPoints: ["is-a vs can-do", "Diamond problem", "Versioning"], companies: ["Zoho", "Microsoft"] },
      { category: "OOP", difficulty: "Medium", question: "What is polymorphism? Compile-time vs runtime with examples.", guidance: "Overloading (compile-time) vs overriding (runtime dispatch). Mention vtables briefly for C++.", keyPoints: ["Two types + example", "Dynamic dispatch cost", "Language specifics"], companies: ["Amazon", "Flipkart"] },
      { category: "DBMS", difficulty: "Easy", question: "What is normalization? Explain 1NF, 2NF, 3NF.", guidance: "Remove redundancy step by step; give a tiny table example for each form.", keyPoints: ["Anomalies first", "Example per form", "Denormalization tradeoff"], companies: ["TCS", "Infosys"] },
      { category: "DBMS", difficulty: "Medium", question: "INNER JOIN vs LEFT JOIN vs FULL OUTER JOIN with an example.", guidance: "Draw two overlapping circles mentally; write the query for employees without departments.", keyPoints: ["Venn intuition", "NULL handling", "Write the SQL live"], companies: ["Amazon", "Flipkart"] },
      { category: "DBMS", difficulty: "Medium", question: "What is indexing? How does a B+ tree index speed up queries?", guidance: "Trade write cost + space for read speed; B+ tree fan-out keeps height tiny; mention when indexes hurt.", keyPoints: ["Read vs write tradeoff", "B+ tree basics", "Covering index"], companies: ["Microsoft", "Amazon"] },
      { category: "OS", difficulty: "Easy", question: "Process vs thread vs program.", guidance: "Program on disk, process in memory with own space, threads share memory of a process.", keyPoints: ["Memory model", "Context switch cost", "Example"], companies: ["TCS", "Wipro"] },
      { category: "OS", difficulty: "Medium", question: "What is deadlock? Necessary conditions and prevention.", guidance: "Coffman conditions (mutual exclusion, hold-and-wait, no preemption, circular wait); break any one.", keyPoints: ["Four conditions", "Banker's algorithm", "Real example"], companies: ["Microsoft", "Amazon"] },
      { category: "OS", difficulty: "Medium", question: "Explain paging and virtual memory.", guidance: "Fixed-size pages, page tables, TLB; why programs can exceed RAM; thrashing in one line.", keyPoints: ["Page vs frame", "TLB role", "Thrashing"], companies: ["Amazon"] },
      { category: "Networks", difficulty: "Easy", question: "TCP vs UDP — differences and use cases.", guidance: "Reliability/ordering/handshake vs speed; HTTP/video-call examples.", keyPoints: ["Handshake", "Use cases", "Congestion control"], companies: ["TCS", "Infosys"] },
      { category: "Networks", difficulty: "Medium", question: "What happens when you type a URL and press Enter?", guidance: "DNS → TCP/TLS → HTTP request → server processing → response → render. Mention caching layers.", keyPoints: ["Layered answer", "DNS + TLS", "Caching"], companies: ["Microsoft", "Flipkart"] },
      { category: "Networks", difficulty: "Medium", question: "Explain the OSI model layers briefly.", guidance: "All People Seem To Need Data Processing — one-line job + example protocol per layer.", keyPoints: ["Mnemonic", "Example per layer", "TCP/IP mapping"], companies: ["Wipro", "Cognizant"] },
      { category: "DSA", difficulty: "Easy", question: "Reverse a linked list — approach and complexity.", guidance: "Three-pointer iterative O(n)/O(1); offer recursive variant.", keyPoints: ["State complexity", "Edge cases", "Dry run"], companies: ["Zoho", "TCS"] },
      { category: "DSA", difficulty: "Medium", question: "How would you detect a cycle in a linked list?", guidance: "Floyd's tortoise-hare; prove why they meet; finding cycle start as follow-up.", keyPoints: ["O(1) space", "Proof sketch", "Follow-up ready"], companies: ["Amazon", "Microsoft"] },
      { category: "DSA", difficulty: "Hard", question: "Design an LRU cache — data structures and operations.", guidance: "HashMap + doubly linked list; walk through get/put; state O(1).", keyPoints: ["Why both structures", "Walk an example", "Edge cases"], companies: ["Amazon", "Flipkart"] },
      { category: "Projects", difficulty: "Easy", question: "Walk me through your favourite project architecture.", guidance: "Problem → stack choice → your modules → hardest bug → what you'd improve.", keyPoints: ["Diagram words", "Your contribution", "Tradeoffs"], companies: ["TCS", "Zoho", "Amazon"] },
      { category: "Projects", difficulty: "Medium", question: "What was the toughest bug you fixed? How?", guidance: "STAR: symptom, hypotheses, instrumentation, root cause, verification, prevention.", keyPoints: ["Debugging process", "Tools used", "Prevention"], companies: ["Microsoft", "Flipkart"] },
      { category: "Projects", difficulty: "Medium", question: "How would you scale your project to 1M users?", guidance: "Bottlenecks first: stateless app, caching, read replicas, queues, CDN. No buzzword soup.", keyPoints: ["Measure first", "Layered scaling", "Tradeoffs"], companies: ["Amazon", "Flipkart"] },
      { category: "Cybersecurity", difficulty: "Easy", question: "What is SQL injection and how do you prevent it?", guidance: "Untrusted input in queries; parameterized queries + least privilege.", keyPoints: ["Example payload", "Parameterized queries", "ORM care"], companies: ["TCS", "Wipro"] },
      { category: "Cybersecurity", difficulty: "Medium", question: "Explain XSS types and mitigations.", guidance: "Stored/reflected/DOM; output encoding + CSP; HttpOnly cookies.", keyPoints: ["Three types", "CSP", "Cookie flags"], companies: ["Flipkart", "Microsoft"] },
      { category: "Cybersecurity", difficulty: "Medium", question: "How does HTTPS work at a high level?", guidance: "Asymmetric handshake → symmetric session; certificates + CA trust.", keyPoints: ["Handshake sketch", "CA role", "MITM angle"], companies: ["Amazon"] },
      { category: "Cloud", difficulty: "Easy", question: "IaaS vs PaaS vs SaaS with examples.", guidance: "Control vs convenience spectrum; EC2/Elastic Beanstalk/Gmail.", keyPoints: ["Spectrum", "Example each", "When to pick"], companies: ["Accenture", "TCS"] },
      { category: "Cloud", difficulty: "Medium", question: "How would you deploy a full-stack app on AWS?", guidance: "EC2/ECS + RDS + S3/CloudFront + ALB + CI/CD; mention env config and backups.", keyPoints: ["Concrete services", "CI/CD", "Ops basics"], companies: ["Accenture", "Flipkart"] },
      { category: "Cloud", difficulty: "Medium", question: "What is Docker and why do teams use it?", guidance: "Container vs VM; image/layers; reproducible envs from laptop to prod.", keyPoints: ["VM contrast", "Reproducibility", "One hands-on example"], companies: ["Accenture", "Microsoft"] },
    ];
    await prisma.interviewQuestion.createMany({ data: bank });
  }
  if ((await prisma.interviewProgress.count({ where: { userId: student.id } })) === 0) {
    const qs = await prisma.interviewQuestion.findMany({ take: 6 });
    for (const [i, q] of qs.entries()) {
      await prisma.interviewProgress.create({
        data: { userId: student.id, questionId: q.id, status: i < 2 ? "CONFIDENT" : "PRACTICED" },
      });
    }
  }

  // Resources (10) with tags/featured/company.
  const resources = [
    { title: "NeetCode 150 — DSA roadmap", category: "Coding", type: "LINK", url: "https://neetcode.io", description: "Curated DSA list for placements.", level: "Intermediate", tags: ["DSA", "Arrays"], featured: true },
    { title: "Quantitative Aptitude basics", category: "Aptitude", type: "ARTICLE", url: "https://www.indiabix.com", description: "Percentages, ratios, time & work.", level: "Beginner", tags: ["Quant"] },
    { title: "OOPs interview cheat-sheet", category: "Interview", type: "DOC", url: "", description: "Pillars of OOPs with examples.", level: "Beginner", tags: ["OOP", "DBMS"] },
    { title: "SQL in 3 hours", category: "Coding", type: "VIDEO", url: "https://www.youtube.com", description: "Joins, grouping, subqueries.", level: "Beginner", tags: ["SQL", "DBMS"] },
    { title: "TCS NQT previous patterns", category: "Company", type: "ARTICLE", url: "", description: "Repeated topics from NQT.", level: "Intermediate", tags: ["TCS"], company: "TCS" },
    { title: "Resume action verbs guide", category: "Resume", type: "DOC", url: "", description: "Make bullets measurable.", level: "Beginner", tags: ["Resume"] },
    { title: "Amazon LP + DSA prep guide", category: "Company", type: "ARTICLE", url: "", description: "Leadership Principles mapped to stories + DSA list.", level: "Advanced", tags: ["Amazon", "DSA"], company: "Amazon", featured: true },
    { title: "DBMS indexing deep-dive", category: "Interview", type: "VIDEO", url: "https://www.youtube.com", description: "B+ trees, covering indexes, EXPLAIN.", level: "Intermediate", tags: ["DBMS"] },
    { title: "OS deadlock practice set", category: "Aptitude", type: "QUIZ", url: "", description: "10 mixed questions on processes and deadlocks.", level: "Intermediate", tags: ["OS"] },
    { title: "System design primer", category: "Coding", type: "LINK", url: "https://github.com/donnemartin/system-design-primer", description: "Scaling basics for SDE interviews.", level: "Advanced", tags: ["System Design"] },
  ];
  for (const r of resources) {
    const existing = await prisma.resource.findFirst({ where: { title: r.title } });
    if (!existing) await prisma.resource.create({ data: { ...r, url: r.url || undefined } });
  }
  const res1 = await prisma.resource.findFirstOrThrow({ where: { title: "NeetCode 150 — DSA roadmap" } });
  await prisma.resourceBookmark.upsert({
    where: { userId_resourceId: { userId: student.id, resourceId: res1.id } },
    update: {},
    create: { userId: student.id, resourceId: res1.id },
  });

  // Announcements + readiness trend + notifications for demo student.
  const anns = [
    { title: "TCS registrations open", body: "TCS Ninja registrations close soon. Eligible students should apply from the Drives page.", audience: "ALL" as const, createdById: admin.id },
    { title: "Mock aptitude test on Friday", body: "Placement cell will conduct a mock quantitative test. Practice the Aptitude module.", audience: "ALL" as const, createdById: admin.id },
    { title: "Amazon intern deadline in 2 days", body: "Amazon SDE Intern applications close soon. Check eligibility and apply.", audience: "ALL" as const, createdById: admin.id },
  ];
  for (const a of anns) {
    const existing = await prisma.announcement.findFirst({ where: { title: a.title } });
    if (!existing) await prisma.announcement.create({ data: a });
  }
  if ((await prisma.readinessSnapshot.count({ where: { userId: student.id } })) === 0) {
    const trend = [18, 20, 22, 24, 27, 29, 31];
    for (const [i, score] of trend.entries()) {
      await prisma.readinessSnapshot.create({
        data: {
          userId: student.id, score,
          academicsScore: 17, skillsScore: 9,
          codingScore: Math.min(30, 2 + i * 2), aptitudeScore: Math.min(25, 3 + i * 2),
          applicationsScore: i > 4 ? 4 : 0,
          createdAt: new Date(Date.now() - (6 - i) * day),
        },
      });
    }
  }
  if ((await prisma.notification.count({ where: { userId: student.id } })) === 0) {
    await prisma.notification.createMany({
      data: [
        { userId: student.id, type: "PREPARATION", title: "Welcome to PlacePrep", message: "Complete your profile to unlock your readiness score.", link: "/profile" },
        { userId: student.id, type: "APPLICATION_STATUS", title: "Shortlisted: TCS Ninja", message: "Your application moved from APPLIED to SHORTLISTED.", link: "/applications", ref: "seed:tcs-shortlist" },
        { userId: student.id, type: "ANNOUNCEMENT", title: "Mock aptitude test on Friday", message: "Practice the Aptitude module before Friday.", link: "/announcements", ref: "seed:mock-test" },
      ],
    });
  }

  // eslint-disable-next-line no-console
  console.log("[seed] done: admin@placeprep.local / Admin@123, student@placeprep.local / Student@123 (+10 students, 9 companies, 9 drives, bank data)");

  await seedJudge();
}

async function seedJudge() {
  for (const l of LANGUAGES) {
    await prisma.codingLanguage.upsert({
      where: { code: l.code },
      update: { name: l.name, pistonRuntime: l.pistonRuntime, active: true },
      create: { ...l, active: true },
    });
  }
  for (const [title, cases] of Object.entries(TEST_CASES)) {
    const problem = await prisma.codingProblem.findFirst({ where: { title } });
    if (!problem) continue;
    const complexity = COMPLEXITY[title];
    await prisma.codingProblem.update({
      where: { id: problem.id },
      data: {
        slug: problem.slug ?? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        source: "INTERNAL",
        executionSupported: true,
        expectedTimeComplexity: complexity?.time,
        expectedSpaceComplexity: complexity?.space,
        starterCode: STARTERS[title] ?? undefined,
        sampleInput: cases.find((c) => c.sample)?.input ?? cases[0].input,
        sampleOutput: cases.find((c) => c.sample)?.expected ?? cases[0].expected,
      },
    });
    if ((await prisma.codingTestCase.count({ where: { problemId: problem.id } })) === 0) {
      await prisma.codingTestCase.createMany({
        data: cases.map((c, i) => ({
          problemId: problem.id,
          input: c.input,
          expectedOutput: c.expected,
          isSample: c.sample,
          order: i,
        })),
      });
    }
  }
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CheckCircle2, Lock, Unlock, Users, ClipboardList, Rocket, ShieldCheck, Clock, Plus, Trash2, Edit3, Download, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types (JSDoc style) ---
/** @typedef {{ id: string, name: string, grade?: string, createdAt: number, steps: StepStatus[] }} Student */
/** @typedef {{ index: number, title: string, location?: string, instructions: string, completed: boolean, initials?: string, signedBy?: string, signedAt?: number, notes?: string }} StepStatus */

// --- 7 Step Definition ---
const STEP_DEFS = [
  {
    index: 1,
    title: "Sign In",
    location: "Registration Desk",
    instructions: "Sign in, receive your Steps Clearance Sheet and PROCEED TO STEP #2.",
  },
  {
    index: 2,
    title: "Admissions / Re-Admissions",
    location: "Room #202 (1st Floor)",
    instructions:
      "Go to Room #202 to update/complete your Admissions/Re-Admissions Application. Receive initials and wait in Room #201 until directed to bring the Financial Form to STEP #3.",
  },
  {
    index: 3,
    title: "Business Office",
    location: "Business Office",
    instructions: "Make satisfactory financial arrangements in the Business Office. PROCEED TO STEP #4.",
  },
  {
    index: 4,
    title: "Class Schedule",
    location: "Chapel",
    instructions: "In the Chapel, you will receive your completed class schedule. PROCEED TO STEP #5.",
  },
  {
    index: 5,
    title: "Locker Assignment",
    location: "Cafeteria",
    instructions: "Obtain your locker assignment and lock. PROCEED TO STEP #6.",
  },
  {
    index: 6,
    title: "iPad Information",
    location: "Computer Lab",
    instructions: "Receive your iPad information. PROCEED TO STEP #7.",
  },
  {
    index: 7,
    title: "Student ID Scheduling",
    location: "Computer Lab (Mr. Laborde)",
    instructions: "Schedule the taking of your student ID with Mr. Laborde.",
  },
];

// --- Storage Helpers ---
const STORAGE_KEY = "regTracker.students.v1";
const PIN_KEY = "regTracker.staffPin.v1";

function loadStudents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStudents(students) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function newStudent(name, grade) {
  /** @type {Student} */
  return {
    id: crypto.randomUUID(),
    name,
    grade,
    createdAt: Date.now(),
    steps: STEP_DEFS.map((s) => ({
      index: s.index,
      title: s.title,
      location: s.location,
      instructions: s.instructions,
      completed: false,
    })),
  };
}

function percentComplete(student) {
  const done = student.steps.filter((s) => s.completed).length;
  return Math.round((done / STEP_DEFS.length) * 100);
}

// --- Certificates ---
function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString();
}

function CompletionCertificate({ student }) {
  const pct = percentComplete(student);
  const isDone = pct === 100;
  return (
    <Card className="mt-4 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <ShieldCheck className="h-5 w-5" /> Registration Status Certificate
        </CardTitle>
        <CardDescription>Show or print this page as proof of completion.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Student</div>
            <div className="text-lg font-semibold">{student.name}{student.grade ? ` • Grade ${student.grade}` : ""}</div>
            <div className="text-sm text-muted-foreground">Created: {formatDate(student.createdAt)}</div>
          </div>
          <div className="flex flex-col items-start gap-2">
            <div className="w-full"><Progress value={pct} /></div>
            <Badge variant={isDone ? "default" : "secondary"}>{pct}% Complete</Badge>
          </div>
        </div>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Step</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Initials</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {student.steps.map((s) => (
                <TableRow key={s.index}>
                  <TableCell className="font-medium">{s.index}. {s.title}</TableCell>
                  <TableCell>{s.location}</TableCell>
                  <TableCell>{s.completed ? "Completed" : "Pending"}</TableCell>
                  <TableCell>{s.initials || "—"}</TableCell>
                  <TableCell>{s.signedAt ? formatDate(s.signedAt) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={() => window.print()} variant={isDone ? "default" : "secondary"}>
          <Download className="h-4 w-4 mr-2" /> {isDone ? "Print Completion" : "Print Current Status"}
        </Button>
      </CardFooter>
    </Card>
  );
}

// --- Step Card ---
function StepCard({ step, locked, onSign }) {
  const [initials, setInitials] = useState("");
  const [notes, setNotes] = useState("");

  const handleSign = () => {
    if (!initials.trim()) {
      toast.error("Enter staff initials before signing.");
      return;
    }
    onSign({ initials: initials.trim().slice(0, 5).toUpperCase(), notes: notes.trim() || undefined });
    setInitials("");
    setNotes("");
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <Card className={`h-full ${locked ? "opacity-70" : ""}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {step.completed ? <CheckCircle2 className="h-5 w-5" /> : locked ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />} {step.index}. {step.title}
          </CardTitle>
          <CardDescription>
            <span className="font-medium">Location:</span> {step.location}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed">{step.instructions}</p>
          {step.completed && (
            <div className="text-xs text-muted-foreground">
              Signed: <span className="font-semibold">{step.initials}</span> • {step.signedAt ? formatDate(step.signedAt) : ""}
            </div>
          )}
          {!step.completed && !locked && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <Label htmlFor={`initials-${step.index}`}>Staff Initials</Label>
                <Input id={`initials-${step.index}`} placeholder="e.g., ML" value={initials} onChange={(e) => setInitials(e.target.value)} maxLength={5} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor={`notes-${step.index}`}>Notes (optional)</Label>
                <Textarea id={`notes-${step.index}`} placeholder="Any quick notes…" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {locked ? "Unlocks after completing the previous step." : step.completed ? "Completed" : "Awaiting staff sign-off"}
          </div>
          {!step.completed && (
            <Button disabled={locked} onClick={handleSign}>
              <Edit3 className="h-4 w-4 mr-2" /> Sign & Unlock Next
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// --- Student Row for Admin Table ---
function AdminRow({ student, onSelect, onDelete }) {
  const pct = percentComplete(student);
  const stepNow = student.steps.find((s) => !s.completed)?.index ?? 7;
  return (
    <TableRow className="hover:bg-muted/40 cursor-pointer" onClick={() => onSelect(student.id)}>
      <TableCell className="font-medium">{student.name}</TableCell>
      <TableCell>{student.grade || "—"}</TableCell>
      <TableCell>{pct}%</TableCell>
      <TableCell>Step {stepNow}</TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(student.id); }}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

// --- Main App ---
export default function RegistrationTrackerApp() {
  const [students, setStudents] = useState(() => loadStudents());
  const [currentId, setCurrentId] = useState(() => students[0]?.id || null);
  const [staffMode, setStaffMode] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [pinSet, setPinSet] = useState(() => localStorage.getItem(PIN_KEY) || "2025");
  const [query, setQuery] = useState("");

  useEffect(() => saveStudents(students), [students]);

  const current = useMemo(() => students.find((s) => s.id === currentId) || null, [students, currentId]);
  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.name.toLowerCase().includes(q) || (s.grade || "").toLowerCase().includes(q));
  }, [students, query]);

  const handleAddStudent = (name, grade) => {
    if (!name?.trim()) {
      toast.error("Enter a student name.");
      return;
    }
    const ns = newStudent(name.trim(), grade?.trim());
    setStudents((prev) => [ns, ...prev]);
    setCurrentId(ns.id);
    toast.success(`Created student profile for ${ns.name}`);
  };

  const handleDeleteStudent = (id) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    if (currentId === id) setCurrentId(students[0]?.id || null);
  };

  const signStep = (idx, payload) => {
    if (!staffMode) {
      toast.error("Enable Staff Mode to sign steps.");
      return;
    }
    setStudents((prev) =>
      prev.map((stu) => {
        if (stu.id !== currentId) return stu;
        const steps = stu.steps.map((s) => {
          if (s.index !== idx) return s;
          return {
            ...s,
            completed: true,
            initials: payload.initials,
            notes: payload.notes,
            signedAt: Date.now(),
          };
        });
        return { ...stu, steps };
      })
    );
    toast.success(`Step ${idx} signed. Next step unlocked.`);
  };

  const resetStudent = (id) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...newStudent(s.name, s.grade), id: s.id, createdAt: s.createdAt } : s))
    );
  };

  const completeCountByStep = useMemo(() => {
    const counts = new Array(7).fill(0);
    students.forEach((stu) => {
      const done = stu.steps.filter((s) => s.completed).length;
      const currentStep = Math.min(done + 1, 7);
      counts[currentStep - 1] += 1;
    });
    return counts;
  }, [students]);

  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState("");

  const attemptStaffLogin = () => {
    const saved = pinSet || "2025";
    if (enteredPin === saved) {
      setStaffMode(true);
      setEnteredPin("");
      toast.success("Staff Mode enabled");
    } else {
      toast.error("Incorrect PIN");
    }
  };

  const updatePin = () => {
    if (enteredPin.length < 4) {
      toast.error("PIN must be at least 4 digits");
      return;
    }
    localStorage.setItem(PIN_KEY, enteredPin);
    setPinSet(enteredPin);
    setEnteredPin("");
    toast.success("Staff PIN updated");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <ClipboardList className="h-8 w-8" /> Registration Progress Tracker
            </h1>
            <p className="text-muted-foreground">7-step guided workflow with staff sign‑off at each stage.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="staff">Staff Mode</Label>
              <Switch id="staff" checked={staffMode} onCheckedChange={(v) => setStaffMode(v)} />
            </div>
            {!staffMode && (
              <div className="flex items-center gap-2">
                <Input value={enteredPin} onChange={(e) => setEnteredPin(e.target.value)} placeholder="Enter Staff PIN" type="password" className="w-40" />
                <Button onClick={attemptStaffLogin} variant="secondary">Unlock</Button>
              </div>
            )}
          </div>
        </header>

        <Tabs defaultValue="students" className="w-full">
          <TabsList className="grid grid-cols-3 md:w-[500px]">
            <TabsTrigger value="students"><Users className="h-4 w-4 mr-2" /> Students</TabsTrigger>
            <TabsTrigger value="workflow"><Rocket className="h-4 w-4 mr-2" /> Workflow</TabsTrigger>
            <TabsTrigger value="admin"><ShieldCheck className="h-4 w-4 mr-2" /> Admin</TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Add / Select Student</CardTitle>
                <CardDescription>Create a student record, then switch to the Workflow tab.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="md:col-span-2">
                  <Label htmlFor="name">Student Name</Label>
                  <Input id="name" placeholder="e.g., Jordan Smith" value={newName} onChange={(e) => setNewName(e.target.value)} />
                </div>
                <div className="md:col-span-1">
                  <Label htmlFor="grade">Grade</Label>
                  <Input id="grade" placeholder="e.g., 9" value={newGrade} onChange={(e) => setNewGrade(e.target.value)} />
                </div>
                <div className="md:col-span-1 flex items-end">
                  <Button onClick={() => { handleAddStudent(newName, newGrade); setNewName(""); setNewGrade(""); }}>
                    <Plus className="h-4 w-4 mr-2" /> Add Student
                  </Button>
                </div>
                <div className="md:col-span-2 flex items-end justify-end gap-2">
                  <div className="relative w-full md:w-64">
                    <Input placeholder="Search students" value={query} onChange={(e) => setQuery(e.target.value)} />
                    <Search className="h-4 w-4 absolute right-2 top-3 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Student List</CardTitle>
                <CardDescription>Click a row to select a student.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>% Complete</TableHead>
                      <TableHead>Current Step</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">No students yet. Add one above.</TableCell>
                      </TableRow>
                    )}
                    {filteredStudents.map((s) => (
                      <AdminRow key={s.id} student={s} onSelect={setCurrentId} onDelete={handleDeleteStudent} />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflow Tab */}
          <TabsContent value="workflow" className="space-y-4">
            {!current ? (
              <Card>
                <CardHeader>
                  <CardTitle>Select a student</CardTitle>
                  <CardDescription>Add or choose a student from the Students tab.</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{current.name}{current.grade ? ` • Grade ${current.grade}` : ""}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-48"><Progress value={percentComplete(current)} /></div>
                        <Badge variant="secondary">{percentComplete(current)}% Complete</Badge>
                      </div>
                    </CardTitle>
                    <CardDescription>Follow the steps below. Each one requires staff initials to unlock the next.</CardDescription>
                  </CardHeader>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {current.steps.map((s, i) => {
                    const locked = i > 0 && !current.steps[i - 1].completed;
                    return (
                      <StepCard key={s.index} step={s} locked={locked} onSign={(payload) => signStep(s.index, payload)} />
                    );
                  })}
                </div>

                <CompletionCertificate student={current} />

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Tip: Use the Admin tab to update the Staff PIN and see flow metrics.</div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => resetStudent(current.id)}>Reset This Student</Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Admin Tab */}
          <TabsContent value="admin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Staff PIN & Security</CardTitle>
                <CardDescription>Control Staff Mode access on shared devices.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="pin">Set / Update Staff PIN</Label>
                  <Input id="pin" type="password" placeholder="New PIN" value={enteredPin} onChange={(e) => setEnteredPin(e.target.value)} />
                </div>
                <div className="md:col-span-1 flex items-end">
                  <Button onClick={updatePin}><ShieldCheck className="h-4 w-4 mr-2" /> Save PIN</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Flow Overview</CardTitle>
                <CardDescription>How many students are at each step (includes current step for in‑progress students).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                  {STEP_DEFS.map((s, idx) => (
                    <div key={s.index} className="p-4 rounded-2xl border bg-white flex flex-col gap-2 items-start shadow-sm">
                      <div className="text-xs text-muted-foreground">Step {s.index}</div>
                      <div className="font-semibold leading-tight">{s.title}</div>
                      <Badge>{completeCountByStep[idx]}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bulk Actions</CardTitle>
                <CardDescription>Export, import, or clear local data (device only).</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => {
                  const blob = new Blob([JSON.stringify(students, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'registration-tracker-export.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}>Export JSON</Button>
                <Button variant="destructive" onClick={() => {
                  if (confirm('Clear all students from this device?')) {
                    setStudents([]);
                    setCurrentId(null);
                    localStorage.removeItem(STORAGE_KEY);
                  }
                }}>Clear Device Data</Button>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">
                  Note: This MVP stores data in this device's local storage. For multi‑device, real‑time syncing, connect a backend (e.g., Supabase/Firebase) and replace the storage helpers.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <footer className="pt-4 text-center text-xs text-muted-foreground">
          Built as an MVP demo. Customize branding, colors, and step wording in code.
        </footer>
      </div>
    </div>
  );
}

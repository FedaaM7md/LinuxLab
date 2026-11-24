/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

export type Locale = "ar" | "en";

export interface LocalizedText {
  ar: string;
  en: string;
}

export type Expectation =
  | { kind: "equals"; value: string }
  | { kind: "contains"; value: string; ignoreCase?: boolean }
  | { kind: "notContains"; value: string; ignoreCase?: boolean }
  | { kind: "matches"; pattern: string; flags?: string }
  | { kind: "lineCount"; count: number }
  | { kind: "exitCode"; code: number };

export interface LessonCheck {
  /** A read-only command executed through the active Shell backend. */
  command: string;
  expect: Expectation;
  /** Shown to the learner when this individual check fails. */
  label: LocalizedText;
}

export interface LessonStep {
  id: string;
  title: LocalizedText;
  instruction: LocalizedText;
  hint: LocalizedText;
  /** Commands shown as copyable-looking code examples (not auto-run). */
  examples?: string[];
  checks: LessonCheck[];
}

export type LessonId = "navigation" | "files" | "permissions" | "text";

export interface Lesson {
  id: LessonId;
  number: number;
  title: LocalizedText;
  subtitle: LocalizedText;
  goal: LocalizedText;
  steps: LessonStep[];
}

const check = (
  command: string,
  expect: Expectation,
  ar: string,
  en: string,
): LessonCheck => ({ command, expect, label: { ar, en } });

const HOME_PATTERN = "^(/home/[A-Za-z0-9._-]+|/root)$";

export const LESSONS: Lesson[] = [
  {
    id: "navigation",
    number: 1,
    title: { ar: "التنقل في النظام", en: "Navigation" },
    subtitle: { ar: "اعرف موقعك وتحرّك بين المجلدات", en: "Know where you are and move around" },
    goal: {
      ar: "استخدام pwd لطباعة المسار الحالي، وls لاستعراض المحتويات، وcd للانتقال بين المجلدات.",
      en: "Use pwd to print the working directory, ls to inspect contents, and cd to move between folders.",
    },
    steps: [
      {
        id: "where-am-i",
        title: { ar: "أين أنا؟", en: "Where am I?" },
        instruction: {
          ar: "تبدأ كل جلسة في مجلد المستخدم الرئيسي. اطبع المسار الحالي باستخدام pwd ثم اقرأ الناتج.",
          en: "Every session starts in your home directory. Print the current path with pwd and read the output.",
        },
        hint: {
          ar: "pwd تعني Print Working Directory. الناتج يبدأ دائمًا بشرطة مائلة /. إن لم تكن في مجلدك الرئيسي فاكتب cd ~ أولًا.",
          en: "pwd means Print Working Directory. The result always starts with a slash /. If you are not in your home directory, run cd ~ first.",
        },
        examples: ["pwd"],
        checks: [
          check("pwd", { kind: "matches", pattern: HOME_PATTERN }, "أنت داخل مجلد المستخدم الرئيسي", "You are in your home directory"),
        ],
      },
      {
        id: "enter-documents",
        title: { ar: "ادخل إلى documents", en: "Enter documents" },
        instruction: {
          ar: "استعرض المحتويات باستخدام ls، ثم انتقل إلى مجلد documents بأمر cd. تأكد من موقعك الجديد باستخدام pwd.",
          en: "List the contents with ls, then move into the documents folder with cd. Confirm the new location with pwd.",
        },
        hint: {
          ar: "cd documents ينتقل إلى مجلد فرعي. لا تضع مسافة بين cd والمسار إلا مسافة واحدة.",
          en: "cd documents moves into a subfolder. Use a single space between cd and the path.",
        },
        examples: ["ls", "cd documents", "pwd"],
        checks: [
          check("pwd", { kind: "matches", pattern: "/documents$" }, "مجلد العمل الحالي هو documents", "The working directory is documents"),
          check("ls ~/documents", { kind: "contains", value: "notes.txt" }, "مجلد documents يحتوي على notes.txt", "The documents folder contains notes.txt"),
        ],
      },
      {
        id: "back-home",
        title: { ar: "ارجع إلى مجلدك الرئيسي", en: "Back home" },
        instruction: {
          ar: "استخدم cd .. للصعود مستوى واحدًا إلى المجلد الأب، أو cd ~ للعودة مباشرة إلى الرئيسي. تحقّق باستخدام pwd.",
          en: "Use cd .. to go up one level, or cd ~ to jump straight home. Verify with pwd.",
        },
        hint: {
          ar: "النقطتان .. تعنيان المجلد الأب، والموجة ~ تعني مجلد المستخدم الرئيسي.",
          en: "Two dots .. mean the parent folder, and the tilde ~ means your home directory.",
        },
        examples: ["cd ..", "pwd"],
        checks: [
          check("pwd", { kind: "matches", pattern: HOME_PATTERN }, "عدت إلى مجلد المستخدم الرئيسي", "You are back in your home directory"),
        ],
      },
      {
        id: "enter-projects",
        title: { ar: "انتقل إلى projects", en: "Move to projects" },
        instruction: {
          ar: "من مجلدك الرئيسي انتقل إلى projects. هذا مجلد آخر من المستوى نفسه. استخدم pwd للتأكيد.",
          en: "From your home directory, move into projects — another folder at the same level. Use pwd to confirm.",
        },
        hint: {
          ar: "cd projects يعمل من الرئيسي مباشرة. يمكنك أيضًا استخدام cd ~/projects.",
          en: "cd projects works directly from home. You can also use cd ~/projects.",
        },
        examples: ["cd projects", "ls", "pwd"],
        checks: [
          check("pwd", { kind: "matches", pattern: "/projects$" }, "مجلد العمل الحالي هو projects", "The working directory is projects"),
          check("ls ~/projects", { kind: "contains", value: "hello.txt" }, "قائمة projects تعرض hello.txt", "The projects listing shows hello.txt"),
        ],
      },
    ],
  },
  {
    id: "files",
    number: 2,
    title: { ar: "الملفات والمجلدات", en: "Files & folders" },
    subtitle: { ar: "أنشئ، انسخ، انقل، احذف واقرأ", en: "Create, copy, move, delete and read" },
    goal: {
      ar: "بناء مساحة عمل صغيرة باستخدام mkdir وtouch وcp وmv وrm وcat.",
      en: "Build a small workspace with mkdir, touch, cp, mv, rm and cat.",
    },
    steps: [
      {
        id: "make-practice",
        title: { ar: "أنشئ مجلد practice", en: "Create a practice folder" },
        instruction: {
          ar: "أنشئ مجلدًا جديدًا اسمه practice داخل مجلدك الرئيسي باستخدام mkdir. استعرض الرئيسي باستخدام ls.",
          en: "Create a new folder named practice inside your home directory with mkdir. List home with ls.",
        },
        hint: {
          ar: "mkdir ~/practice ينشئ مجلدًا واحدًا. استخدم mkdir -p لإنشاء سلسلة مجلدات دفعة واحدة.",
          en: "mkdir ~/practice creates one folder. Use mkdir -p when parent folders might be missing.",
        },
        examples: ["mkdir ~/practice", "ls"],
        checks: [
          check("ls ~", { kind: "matches", pattern: "(^|\\s)practice(\\s|$)" }, "المجلد practice موجود في الرئيسي", "The practice folder exists in home"),
        ],
      },
      {
        id: "create-empty",
        title: { ar: "أنشئ ملفًا فارغًا", en: "Create an empty file" },
        instruction: {
          ar: "استخدم touch لإنشاء ملف فارغ اسمه empty.txt داخل practice.",
          en: "Use touch to create an empty file named empty.txt inside practice.",
        },
        hint: {
          ar: "المسار ~/practice/empty.txt يشير إلى مجلدك الرئيسي. إن كان الملف موجودًا فسيحدّث touch وقت تعديله فقط.",
          en: "The ~/practice/empty.txt path points at your home directory. If the file exists, touch only updates its timestamp.",
        },
        examples: ["touch ~/practice/empty.txt", "ls ~/practice"],
        checks: [
          check("ls ~/practice", { kind: "contains", value: "empty.txt" }, "الملف empty.txt موجود داخل practice", "empty.txt exists inside practice"),
        ],
      },
      {
        id: "copy-readme",
        title: { ar: "انسخ ملف readme", en: "Copy the readme" },
        instruction: {
          ar: "انسخ readme.txt إلى داخل practice باسم welcome.txt باستخدام cp. اقرأ النسخة باستخدام cat.",
          en: "Copy readme.txt into practice as welcome.txt with cp. Read the copy with cat.",
        },
        hint: {
          ar: "cp ~/readme.txt ~/practice/welcome.txt يحدد الملف المصدر ثم الهدف. الهدف هنا لم يكن موجودًا، لذا يُستخدم كاسم جديد.",
          en: "cp ~/readme.txt ~/practice/welcome.txt names the source first, then the destination. The destination does not exist yet, so it becomes the new filename.",
        },
        examples: ["cp ~/readme.txt ~/practice/welcome.txt", "cat ~/practice/welcome.txt"],
        checks: [
          check("cat ~/practice/welcome.txt", { kind: "contains", value: "Linux Lab" }, "نسخة welcome.txt تحتوي على محتوى readme", "The welcome.txt copy contains the readme text"),
        ],
      },
      {
        id: "rename-file",
        title: { ar: "أعد تسمية النسخة", en: "Rename the copy" },
        instruction: {
          ar: "استخدم mv لإعادة تسمية ~/practice/welcome.txt إلى ~/practice/notes.md. تحقّق من أن الاسم القديم اختفى.",
          en: "Use mv to rename ~/practice/welcome.txt to ~/practice/notes.md. Confirm the old name is gone.",
        },
        hint: {
          ar: "mv يعمل على المسارات داخل نفس نظام الملفات كإعادة تسمية فورية.",
          en: "Within the same filesystem, mv acts as an instant rename.",
        },
        examples: ["mv ~/practice/welcome.txt ~/practice/notes.md", "ls ~/practice"],
        checks: [
          check("ls ~/practice", { kind: "contains", value: "notes.md" }, "الاسم الجديد notes.md موجود", "The new name notes.md exists"),
          check("ls ~/practice", { kind: "notContains", value: "welcome.txt" }, "الاسم القديم welcome.txt لم يبقَ", "The old name welcome.txt is gone"),
        ],
      },
      {
        id: "remove-empty",
        title: { ar: "احذف الملف الفارغ", en: "Delete the empty file" },
        instruction: {
          ar: "احذف ~/practice/empty.txt باستخدام rm. لاحظ أن rm لا يسأل عن التأكيد افتراضيًا.",
          en: "Delete ~/practice/empty.txt with rm. Notice that rm does not ask for confirmation by default.",
        },
        hint: {
          ar: "rm ~/practice/empty.txt يحذف ملفًا واحدًا. لحذف مجلد كامل تحتاج rm -r.",
          en: "rm ~/practice/empty.txt deletes a single file. A whole directory needs rm -r.",
        },
        examples: ["rm ~/practice/empty.txt", "ls -l ~/practice"],
        checks: [
          check("ls ~/practice", { kind: "notContains", value: "empty.txt" }, "المساحة لم تعد تحتوي على empty.txt", "empty.txt is no longer listed"),
        ],
      },
      {
        id: "read-result",
        title: { ar: "اقرأ النتيجة", en: "Read the result" },
        instruction: {
          ar: "اقرأ ~/practice/notes.md باستخدام cat وتأكد أن محتوى readme انتقل مع النسخة.",
          en: "Read ~/practice/notes.md with cat and confirm the readme content travelled with the copy.",
        },
        hint: {
          ar: "يطبع cat عدة ملفات متتالية. للملفات الطويلة استخدم less في نظام حقيقي.",
          en: "cat prints several files back to back. On a real system, use less for long files.",
        },
        examples: ["cat ~/practice/notes.md"],
        checks: [
          check("cat ~/practice/notes.md", { kind: "contains", value: "A safe place to practise" }, "notes.md يحتوي على نص readme", "notes.md contains the readme text"),
        ],
      },
    ],
  },
  {
    id: "permissions",
    number: 3,
    title: { ar: "الأذونات", en: "Permissions" },
    subtitle: { ar: "اقرأ الأذونات وغيّرها بأمان", en: "Read and change file modes safely" },
    goal: {
      ar: "فهم حقول ls -l وتغيير الأذونات باستخدام chmod بالأرقام والرموز.",
      en: "Understand ls -l columns and change permissions with numeric and symbolic chmod.",
    },
    steps: [
      {
        id: "inspect-script",
        title: { ar: "افحص أذونات السكربت", en: "Inspect the script" },
        instruction: {
          ar: "اعرض التفاصيل الكاملة للملف ~/scripts/greet.sh باستخدام ls -l. ابحث عن سلسلة مثل -rw-r--r-- في بداية السطر.",
          en: "Show full details for ~/scripts/greet.sh with ls -l. Find a string such as -rw-r--r-- at the start of the line.",
        },
        hint: {
          ar: "الأحرف الثلاثة الأولى بعد النوع تخص المالك، ثم المجموعة، ثم الآخرين: r قراءة، w كتابة، x تنفيذ.",
          en: "The first three characters after the type are for the owner, then group, then others: r read, w write, x execute.",
        },
        examples: ["ls -l ~/scripts/greet.sh"],
        checks: [
          check("ls -l ~/scripts/greet.sh", { kind: "contains", value: "-rw-r--r--" }, "الملف يبدأ بالوضع 644", "The file starts in mode 644"),
        ],
      },
      {
        id: "make-executable",
        title: { ar: "اجعله قابلًا للتنفيذ", en: "Make it executable" },
        instruction: {
          ar: "أضف إذن التنفيذ للمالك والمجموعة والآخرين باستخدام chmod +x. تحقّق باستخدام ls -l.",
          en: "Add execute permission for owner, group and others with chmod +x. Verify with ls -l.",
        },
        hint: {
          ar: "chmod +x ~/scripts/greet.sh يضيف x للجميع دون تغيير بقية الأذونات.",
          en: "chmod +x ~/scripts/greet.sh adds x for everyone without changing the other bits.",
        },
        examples: ["chmod +x ~/scripts/greet.sh", "ls -l ~/scripts/greet.sh"],
        checks: [
          check("ls -l ~/scripts/greet.sh", { kind: "contains", value: "-rwxr-xr-x" }, "وضع السكربت أصبح 755", "The script mode is now 755"),
        ],
      },
      {
        id: "private-readme",
        title: { ar: "اجعل readme خاصًا", en: "Make the readme private" },
        instruction: {
          ar: "اضبط أذونات ~/readme.txt على 600 بحيث يقرأه ويكتبه المالك فقط. تحقّق باستخدام ls -l.",
          en: "Set ~/readme.txt to mode 600 so only the owner can read and write it. Verify with ls -l.",
        },
        hint: {
          ar: "chmod 600 ~/readme.txt: الرقم الأول للمالك (6 = قراءة + كتابة)، والباقي صفر.",
          en: "chmod 600 ~/readme.txt: the first digit is the owner (6 = read + write), the rest are zero.",
        },
        examples: ["chmod 600 ~/readme.txt", "ls -l ~/readme.txt"],
        checks: [
          check("ls -l ~/readme.txt", { kind: "contains", value: "-rw-------" }, "وضع readme.txt أصبح 600", "The readme mode is now 600"),
        ],
      },
      {
        id: "open-scripts-dir",
        title: { ar: "غيّر أذونات مجلد scripts", en: "Open the scripts folder" },
        instruction: {
          ar: "غيّر أذونات مجلد ~/scripts إلى 755. استخدم ls -ld لعرض المجلد نفسه بدلًا من محتوياته.",
          en: "Change the ~/scripts folder to mode 755. Use ls -ld to show the directory itself rather than its contents.",
        },
        hint: {
          ar: "ls -ld ~/scripts يعرض سطر المجلد. السطر يبدأ بحرف d ثم drwxr-xr-x بعد chmod 755.",
          en: "ls -ld ~/scripts shows the directory entry. After chmod 755 the line starts with d followed by rwxr-xr-x.",
        },
        examples: ["chmod 755 ~/scripts", "ls -ld ~/scripts"],
        checks: [
          check("ls -ld ~/scripts", { kind: "contains", value: "drwxr-xr-x" }, "مجلد scripts أصبح 755", "The scripts folder is now 755"),
        ],
      },
    ],
  },
  {
    id: "text",
    number: 4,
    title: { ar: "النصوص والأنابيب", en: "Text & pipes" },
    subtitle: { ar: "ابحث، عُدّ، ووجّه الناتج إلى ملفات", en: "Search, count and redirect output" },
    goal: {
      ar: "استخدام grep وwc مع الأنابيب | وإعادة التوجيه > لإنشاء تقارير صغيرة.",
      en: "Use grep and wc with pipes | and redirection > to build small reports.",
    },
    steps: [
      {
        id: "grep-ok",
        title: { ar: "استخرج الطلبات الناجحة", en: "Extract successful requests" },
        instruction: {
          ar: "ملف السجل ~/logs/access.log يحتوي طلبات ويعرض رمز الحالة. استخدم grep لاختيار الأسطر التي تحتوي 200 ووجّه الناتج إلى ~/reports/ok.txt.",
          en: "The log ~/logs/access.log lists requests and status codes. Use grep to select lines containing 200 and redirect the output to ~/reports/ok.txt.",
        },
        hint: {
          ar: "grep 200 ~/logs/access.log > ~/reports/ok.txt. الرمز > يستبدل محتوى الملف إن كان موجودًا.",
          en: "grep 200 ~/logs/access.log > ~/reports/ok.txt. The > operator replaces the file if it already exists.",
        },
        examples: ["grep 200 ~/logs/access.log > ~/reports/ok.txt", "cat ~/reports/ok.txt"],
        checks: [
          check("cat ~/reports/ok.txt", { kind: "contains", value: "/index.html" }, "التقرير يحتوي على /index.html", "The report contains /index.html"),
          check("cat ~/reports/ok.txt", { kind: "notContains", value: "404" }, "التقرير لا يحتوي على 404", "The report does not contain 404"),
        ],
      },
      {
        id: "pipe-count",
        title: { ar: "احسب العدد عبر أنبوب", en: "Count through a pipe" },
        instruction: {
          ar: "مرّر ناتج grep إلى wc -l باستخدام |، ثم وجّه العدد إلى ~/reports/count.txt. الملف يجب أن يحتوي الرقم فقط.",
          en: "Pipe grep output into wc -l with |, then redirect the count to ~/reports/count.txt. The file should contain only the number.",
        },
        hint: {
          ar: "grep 200 ~/logs/access.log | wc -l > ~/reports/count.txt. الأنبوب يمرّر المخرجات كمدخلات للأمر التالي.",
          en: "grep 200 ~/logs/access.log | wc -l > ~/reports/count.txt. A pipe passes output as input to the next command.",
        },
        examples: [
          "grep 200 ~/logs/access.log | wc -l",
          "grep 200 ~/logs/access.log | wc -l > ~/reports/count.txt",
        ],
        checks: [
          check("cat ~/reports/count.txt", { kind: "equals", value: "4" }, "العدد المحفوظ هو 4", "The saved count is 4"),
        ],
      },
      {
        id: "grep-blocked",
        title: { ar: "اجمع الطلبات المرفوضة", en: "Capture blocked requests" },
        instruction: {
          ar: "استخرج الأسطر التي تحتوي 403 إلى ~/reports/blocked.txt، ثم اقرأ الملف للتحقق.",
          en: "Extract lines containing 403 into ~/reports/blocked.txt, then read the file to verify.",
        },
        hint: {
          ar: "grep 403 ~/logs/access.log > ~/reports/blocked.txt يعيد سطر POST /login 403 فقط.",
          en: "grep 403 ~/logs/access.log > ~/reports/blocked.txt should leave only the POST /login 403 line.",
        },
        examples: [
          "grep 403 ~/logs/access.log > ~/reports/blocked.txt",
          "cat ~/reports/blocked.txt",
        ],
        checks: [
          check("cat ~/reports/blocked.txt", { kind: "equals", value: "POST /login 403" }, "ملف blocked.txt يحتوي الطلب المرفوض", "blocked.txt contains the rejected request"),
        ],
      },
      {
        id: "grep-insensitive",
        title: {
          ar: "ابحث دون تمييز بين الأحرف الكبيرة والصغيرة",
          en: "Search without case sensitivity",
        },
        instruction: {
          ar: "استخدم grep -i للعثور على كل أسطر login بغض النظر عن حالة الأحرف، مرّرها إلى wc -l، واحفظ العدد في ~/reports/logins.txt.",
          en: "Use grep -i to find every login line regardless of letter case, pipe to wc -l, and save the number in ~/reports/logins.txt.",
        },
        hint: {
          ar: "grep -i login ~/logs/access.log | wc -l > ~/reports/logins.txt. الناتج المتوقع سطران.",
          en: "grep -i login ~/logs/access.log | wc -l > ~/reports/logins.txt. Two matching lines are expected.",
        },
        examples: [
          "grep -i login ~/logs/access.log | wc -l > ~/reports/logins.txt",
        ],
        checks: [
          check("cat ~/reports/logins.txt", { kind: "equals", value: "2" }, "عدد أسطر login هو 2", "The number of login lines is 2"),
        ],
      },
      {
        id: "wc-total",
        title: { ar: "احسب إجمالي الأسطر", en: "Count all lines" },
        instruction: {
          ar: "استخدم wc -l مباشرة على ملف السجل، ووجّه الناتج إلى ~/reports/total.txt. الملف سيحتوي العدد واسم الملف.",
          en: "Run wc -l directly on the log file and redirect the output to ~/reports/total.txt. The file will contain the count and the filename.",
        },
        hint: {
          ar: "wc -l ~/logs/access.log > ~/reports/total.txt ينتج سطرًا يبدأ بالرقم 6.",
          en: "wc -l ~/logs/access.log > ~/reports/total.txt produces a line that starts with 6.",
        },
        examples: [
          "wc -l ~/logs/access.log",
          "wc -l ~/logs/access.log > ~/reports/total.txt",
        ],
        checks: [
          check("cat ~/reports/total.txt", { kind: "matches", pattern: "^\\s*6\\s+" }, "الإجمالي المحفوظ هو 6", "The saved total is 6"),
        ],
      },
    ],
  },
];

export function getLesson(id: LessonId): Lesson {
  const lesson = LESSONS.find((entry) => entry.id === id);
  if (!lesson) throw new Error(`Unknown lesson: ${id}`);
  return lesson;
}

export function totalStepCount(): number {
  return LESSONS.reduce((total, lesson) => total + lesson.steps.length, 0);
}

/**
 * One-line provisioning script for the real v86 guest. It seeds the same demo
 * workspace used by the simulated shell, under the logged-in user's home.
 * Only used in real-VM mode; clearly labelled demo material in the UI.
 */
export const V86_WORKSPACE_COMMAND = [
  "mkdir -p ~/documents ~/projects ~/scripts ~/logs ~/reports",
  "printf '%s\\n' 'Linux Lab' 'A safe place to practise Linux commands.' 'This workspace is a demo, not a real system.' > ~/readme.txt",
  "printf '%s\\n' 'Linux lesson notes' '==================' 'pwd prints the working directory.' 'ls lists files and directories.' 'cd changes the working directory.' > ~/documents/notes.txt",
  "printf '%s\\n' 'Practice pwd' 'Practice ls' 'Practice cd' > ~/documents/todo.txt",
  "printf '%s\\n' 'Hello, learner!' > ~/projects/hello.txt",
  "printf '%s\\n' '#!/bin/sh' 'echo \"Hello from Linux Lab\"' > ~/scripts/greet.sh",
  "printf '%s\\n' 'GET /index.html 200' 'GET /about.html 200' 'POST /login 403' 'GET /pricing.html 200' 'POST /login 200' 'GET /missing.html 404' > ~/logs/access.log",
  "chmod 644 ~/readme.txt ~/documents/notes.txt ~/documents/todo.txt ~/projects/hello.txt ~/scripts/greet.sh ~/logs/access.log",
  "chmod 755 ~/documents ~/projects ~/logs ~/reports",
  "chmod 700 ~/scripts",
].join("; ");

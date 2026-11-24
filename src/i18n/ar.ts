/*
 * Arabic interface copy — Linux Lab.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 *
 * Voice: a patient teacher. Modern Standard Arabic that reads naturally in
 * Egypt. Glossary: terminal = الطرفية، chapter = الفصل، step = خطوة.
 */

import type { TranslationKey } from "./en";

export const ar: Record<TranslationKey, string> = {
  "brand.name": "Linux Lab",
  "brand.descriptor": "معمل لينكس",

  "doc.title": "الفصل {number}: {title} — Linux Lab",

  "header.skip": "تخطَّ إلى المحتوى",
  "header.courseMap": "خريطة الفصول",
  "header.notebook": "الدفتر",
  "header.terminal": "الطرفية",
  "header.language": "اللغة",
  "header.langArabic": "العربية",
  "header.langEnglish": "English",
  "header.themeToPaper": "التبديل إلى الوضع الورقي",
  "header.themeToBoard": "التبديل إلى السبورة",

  "demo.badge": "تجريبي",
  "demo.note": "يُحفظ التقدّم في هذا المتصفح فقط.",
  "demo.resetTitle": "أتمسح بيانات التجربة؟",
  "demo.resetBody":
    "سيُمسح التقدّم المكتمل ويبدأ المعمل من الفصل الأول. جلسة الطرفية الحالية لن تتغير.",
  "demo.resetConfirm": "امسح البيانات",

  "chapter.kicker": "خريطة الفصول",
  "chapter.title": "من تحديد موقعك إلى الأنابيب",
  "chapter.summary": "أكملت {done} من {total} خطوة",
  "chapter.percent": "{percent}%",
  "chapter.lessonNumber": "الفصل {number}",
  "chapter.notStarted": "لم يبدأ",
  "chapter.complete": "مكتمل",
  "chapter.inProgress": "{done} من {total}",
  "chapter.current": "أنت هنا",

  "lesson.kicker": "الفصل {number} · {count} خطوات",
  "lesson.goal": "ما ستتدرب عليه",
  "lesson.steps": "قائمة الخطوات",
  "lesson.stepOf": "الخطوة {current} من {total}",
  "lesson.completed": "تمت",
  "lesson.current": "الآن",
  "lesson.upcoming": "التالية",
  "lesson.hint": "تلميح",
  "lesson.showHint": "اعرض تلميحًا",
  "lesson.hideHint": "أخفِ التلميح",
  "lesson.check": "تحقّق من عملي",
  "lesson.checking": "جارٍ التحقق…",
  "lesson.autoGraded": "يُقيَّم العمل من حالة الطرفية عبر أوامر قراءة فقط.",
  "lesson.failed": "ليست بعد",
  "lesson.failedBody": "اقرأ الخطوة مرة أخرى، وافتح التلميح، ثم حاول. لن يضيع شيء.",
  "lesson.checkError": "تعذّر تشغيل الفحص: {error}",
  "lesson.doneTitle": "أكملت الفصل",
  "lesson.doneBody": "كل خطوات هذا الفصل مكتملة.",
  "lesson.nextLesson": "الفصل التالي",
  "lesson.finishCourse": "ارجع إلى الفصل الأول",
  "lesson.shellNotReady": "الطرفية غير جاهزة. شغّل الجهاز أو ارجع إلى الطرفية التجريبية.",
  "lesson.checklist": "ما يقرأه الفحص",
  "lesson.example": "اكتبها في الطرفية",
  "lesson.demoFiles":
    "مساحة العمل بها ملفات تجريبية. التغييرات تبقى في هذه النافذة ولا تُحفظ في مكان آخر.",
  "lesson.allDoneTitle": "أكملت الدورة",
  "lesson.allDoneBody":
    "أكملت الخطوات التسع عشرة كلها. يمكنك العودة إلى أي فصل للتدريب مرة أخرى.",
  "terminal.windowTitle": "طرفية المعمل",
  "terminal.loading": "جارٍ تجهيز الطرفية…",
  "terminal.welcome": "مرحبًا — اكتب help لعرض قائمة الأوامر.",
  "terminal.aria": "طرفية تفاعلية",
  "terminal.focus": "انقر داخل الطرفية لتكتب.",
  "terminal.notStarted": "الجهاز متوقف. شغّله ليبدأ الإقلاع.",
  "terminal.start": "تشغيل",
  "terminal.stop": "إيقاف",
  "terminal.restart": "إعادة التشغيل",
  "terminal.newSession": "جلسة جديدة",
  "terminal.clear": "امسح الشاشة",
  "terminal.memory": "ذاكرة الجهاز",
  "terminal.memoryMb": "{size} ميجابايت",
  "terminal.check": "تحقّق من الخطوة",
  "terminal.checking": "جارٍ التحقق…",
  "terminal.demoHint": "نظام ملفات وهمي — التغييرات تبقى في هذه النافذة فقط.",
  "mode.simulatedShort": "محاكاة",
  "mode.v86Short": "جهاز حقيقي",
  "mode.simulatedBadge": "تجريبي",
  "mode.v86Badge": "جهاز حقيقي",
  "mode.v86Notice": "ضيف لينكس حقيقي يعمل محليًا عبر v86، والصور يوفّرها المشغّل.",
  "mode.switchAria": "اختر نمط الطرفية",

  "status.idle": "جاهزة للبدء",
  "status.probing": "جارٍ فحص الصور",
  "status.missing": "الصور غير موجودة",
  "status.starting": "جارٍ التشغيل",
  "status.running": "تعمل",
  "status.stopped": "متوقفة",
  "status.error": "خطأ",
  "status.simulated": "جاهزة (تجريبية)",
  "progress.completedSteps": "{done} من {total} خطوة",
  "progress.reset": "إعادة تعيين التقدّم",
  "progress.resetTitle": "أتعيد تعيين التقدّم؟",
  "progress.resetBody":
    "سيُمسح التقدّم المكتمل ويبدأ المعمل من الفصل الأول. جلسة الطرفية الحالية لن تتغير.",
  "progress.resetConfirm": "أعد التعيين",

  "setup.title": "صور لينكس غير مثبّتة",
  "setup.body":
    "يحتاج نمط الجهاز الحقيقي إلى ملفات صور محلية. هذه الملفات غير مضمّنة، والتطبيق لا ينزّلها. ضعها في المجلد التالي ثم أعد الفحص.",
  "setup.folder": "مجلد الصور",
  "setup.required": "الملفات المطلوبة",
  "setup.missing": "مفقود",
  "setup.found": "موجود",
  "setup.unknown": "لم يُفحص",
  "setup.biosPurpose": "BIOS للنظام x86 (SeaBIOS)",
  "setup.vgaPurpose": "BIOS لبطاقة العرض",
  "setup.cdromPurpose": "قرص لينكس حي قابل للإقلاع",
  "setup.hddPurpose": "صورة قرص صلب اختيارية",
  "setup.docs": "المصادر وبصمات التحقق والتراخيص موثّقة في docs/IMAGES.md.",
  "setup.recheck": "إعادة الفحص",
  "setup.checking": "جارٍ الفحص…",
  "setup.useSimulated": "استخدم الطرفية التجريبية",
  "setup.sizeHint":
    "يرسل الفحص طلب HTTP HEAD. أي استجابة HTML، مثل صفحة خادم التطوير البديلة، تُعدّ ملفًا مفقودًا.",
  "setup.simulatedFallback": "يمكنك متابعة التعلّم بالطرفية التجريبية إلى أن تتوفر الصور.",

  "footer.demoNote": "نسخة عرض — البيانات افتراضية.",
  "footer.links": "معلومات المنتج",
  "footer.about": "عن المعمل",
  "footer.privacy": "الخصوصية",
  "footer.terms": "الشروط",
  "footer.help": "المساعدة",
  "footer.changelog": "سجل التغييرات",
  "footer.version": "الإصدار {version}",
  "footer.copyright": "© 2026 معمل لينكس. جميع الحقوق محفوظة.",
  "footer.credit": "تصميم وتطوير: فداء محمد",

  "info.about.title": "عن معمل لينكس",
  "info.about.body":
    "معمل لينكس مساحة للتدريب على سطر أوامر لينكس، عربي أولًا، للفصل الدراسي أو التعلم الذاتي. يعمل بالكامل داخل المتصفح.\n\nللتواصل: {email} · {phone}\nالعنوان: القاهرة الجديدة، مصر\n\nالإصدار {version}.",
  "info.privacy.title": "الخصوصية",
  "info.privacy.body":
    "لا حسابات ولا تتبّع ولا إعلانات ولا طلبات إلى شبكات توصيل.\n\nيُخزَّن التقدّم واللغة والمظهر وإعدادات الطرفية في هذا المتصفح فقط. لا تُرسل إلى أي خادم. مسح بيانات الموقع أو استخدام «إعادة تعيين التقدّم» يحذفها.\n\nللتواصل: hello@linuxlab.example",
  "info.terms.title": "شروط الاستخدام",
  "info.terms.body":
    "معمل لينكس نسخة تعليمية تُقدَّم كما هي، دون ضمانات من أي نوع.\n\nاستخدمه للتعلّم والتدريب فقط. لا تعتمد عليه في قرارات إنتاجية أو شهادات أو سجلات تقييم.\n\nتخضع هذه الشروط لقوانين جمهورية مصر العربية، وأي نزاع تختص به محاكم القاهرة.\n\nللتواصل: hello@linuxlab.example",
  "info.help.title": "المساعدة",
  "info.help.body":
    "ابدأ من الفصل الأول في خريطة الفصول. اقرأ الدرس، واكتب الأمر في الطرفية، ودع المعمل يتحقق من عملك.\n\nإن فشل أمر، افتح التلميح. زر «تحقّق من عملي» يستخدم فحوصًا للقراءة فقط ولا يغيّر ملفاتك.\n\nوضع الجهاز الحقيقي يحتاج ملفات BIOS/ISO محلية. من دونها، الطرفية التجريبية هي المسار المقصود.\n\nيُحفظ التقدّم في هذا المتصفح فقط. استخدم «إعادة تعيين التقدّم» للبدء من جديد.",
  "info.changelog.title": "سجل التغييرات",
  "info.changelog.body":
    "الإصدار {version} — 24 نوفمبر 2026\n\nهوية دفتر وسبورة جديدة، وخريطة فصول، وعلامات صح مرسومة، ومراجعة النصوص العربية والإنجليزية، ووضع تجريبي هادئ، وصفحات الخصوصية والشروط والمساعدة، وترويسات أمان أقوى، وإصلاحات للاستجابة.",

  "a11y.lessonPanel": "دفتر الدرس",
  "a11y.terminalPanel": "الطرفية وأدوات التحكم",
  "a11y.progress": "تقدّم الدورة",
  "a11y.chapterMap": "خريطة الفصول وتقدّم الدورة",
  "a11y.demoNote": "تنبيه الوضع التجريبي",
  "a11y.brandHome": "Linux Lab — انتقل إلى خريطة الفصول",
  "a11y.stepList": "خطوات هذا الفصل",
  "a11y.sectionNav": "أقسام الصفحة",
  "a11y.footerLinks": "روابط المنتج والمعلومات القانونية",

  "mobile.tabLesson": "الدفتر",
  "mobile.tabTerminal": "الطرفية",

  "toast.stepComplete": "اكتملت الخطوة",
  "toast.lessonComplete": "اكتمل الفصل",
  "toast.progressReset": "أُعيد تعيين التقدّم",
  "toast.demoReset": "أُعيد تعيين بيانات التجربة",
  "toast.progressRestored": "أُعيد التقدّم",

  "common.close": "إغلاق",
  "common.cancel": "إلغاء",
  "common.undo": "تراجع",

  "error.storage": "تعذّر حفظ التقدّم في هذا المتصفح.",
  "error.unknown": "حدث خطأ غير متوقع.",
};

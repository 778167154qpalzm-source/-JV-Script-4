(() => {
  const $ = id => document.getElementById(id);
  const nav = $("exampleNav"), search = $("searchInput");
  let activeId = window.EXAMPLES[0].id;
  const groups = ["البداية","المتغيرات","أنواع البيانات","الصفحة الرابعة: العوامل","الصفحة الخامسة: العوامل الحسابية","الصفحة السادسة: عوامل المقارنة","الصفحة السابعة: العوامل المنطقية","الصفحة الثامنة: العوامل البتّية","الصفحة التاسعة: عوامل الإسناد","الصفحة العاشرة: عوامل الأنواع"];
  function renderNav() {
    const q = search.value.trim().toLowerCase();
    nav.innerHTML = "";
    groups.forEach((group, gi) => {
      const items = window.EXAMPLES.filter(x => x.group === group && (x.title.toLowerCase().includes(q) || x.desc.toLowerCase().includes(q) || x.topic.toLowerCase().includes(q)));
      if (!items.length) return;
      const section = document.createElement("div"); section.className = "nav-group";
      const heading = document.createElement("div"); heading.className = "nav-group-title"; heading.textContent = group;
      section.appendChild(heading);
      items.forEach((ex, i) => {
        const btn = document.createElement("button");
        btn.className = "nav-item" + (ex.id === activeId ? " active" : "");
        btn.innerHTML = `<span class="nav-icon">${gi === 0 ? "⌘" : gi === 1 ? "x=" : gi === 2 ? "◈" : gi === 3 ? "ƒx" : gi === 4 ? "±" : "⇄"}</span><span class="nav-label"></span><span class="nav-count"></span>`;
        btn.querySelector(".nav-label").textContent = ex.title;
        btn.querySelector(".nav-count").textContent = String(window.EXAMPLES.indexOf(ex)+1).padStart(2,"0");
        btn.addEventListener("click", () => { activeId = ex.id; renderNav(); renderExample(ex); $("sidebar").classList.remove("mobile-open"); });
        section.appendChild(btn);
      });
      nav.appendChild(section);
    });
    if (!nav.children.length) nav.innerHTML = '<p class="result-muted" style="padding:10px">لا توجد أمثلة مطابقة للبحث.</p>';
  }
  function renderExample(ex) {
    $("crumbCategory").textContent = ex.group;
    $("crumbTitle").textContent = ex.title;
    $("pageHeading").textContent = ex.title;
    $("pageDescription").textContent = "عدّل المدخلات ثم نفّذ المثال، وستظهر النتيجة في لوحة المعاينة.";
    $("exampleTitle").textContent = ex.title;
    $("exampleNumber").textContent = String(window.EXAMPLES.indexOf(ex)+1).padStart(2,"0");
    $("explanation").textContent = ex.desc;
    $("sourceTopic").textContent = ex.topic;
    $("sourceLink").href = ex.url;
    $("sourceCode").textContent = buildFullSource(ex);
    $("controls").innerHTML = "";
    (ex.fields || []).forEach(field => {
      const wrap = document.createElement("div"); wrap.className = "field" + (field.full ? " full" : "");
      const label = document.createElement("label"); label.htmlFor = "input-"+field.id; label.textContent = field.label; wrap.appendChild(label);
      let input;
      if (field.type === "select") {
        input = document.createElement("select");
        (field.options || []).forEach(([value, text]) => { const opt = document.createElement("option"); opt.value=value; opt.textContent=text; input.appendChild(opt); });
      } else {
        input = document.createElement(field.type === "textarea" ? "textarea" : "input");
        if (field.type && field.type !== "textarea") input.type = field.type;
      }
      input.id = "input-"+field.id; input.value = field.value ?? ""; input.dataset.field = field.id;
      wrap.appendChild(input); $("controls").appendChild(wrap);
    });
    $("output").innerHTML = '<div class="empty-state"><span>↳</span><p>اضغط «تنفيذ المثال» لعرض النتيجة.</p></div>';
    $("errorBox").hidden = true;
    $("runButton").onclick = () => runExample(ex);
    $("resetButton").onclick = () => {
      (ex.fields || []).forEach(f => { const input = document.querySelector(`[data-field="${CSS.escape(f.id)}"]`); if(input) input.value = f.value ?? ""; });
      $("errorBox").hidden = true;
      $("output").innerHTML = '<div class="empty-state"><span>↳</span><p>تمت إعادة ضبط المدخلات. نفّذ المثال لعرض النتيجة.</p></div>';
    };
    if (!ex.fields || !ex.fields.length) $("controls").innerHTML = '<p class="result-muted">لا يحتاج هذا المثال إلى مدخلات.</p>';
    if (isNativeDemo(ex)) {
      $("output").innerHTML = '<div class="empty-state"><span>↗</span><p>هذا المثال يفتح نافذة أو رسالة متصفح حقيقية. اضغط «تنفيذ المثال» لتجربته.</p></div>';
    } else {
      runExample(ex, { previewOnly: true });
    }
  }

  function buildFullSource(ex) {
    // اعرض ملف HTML كاملًا يمكن نسخه وحفظه، وليس مقتطف JavaScript فقط.
    let js = String(ex.code || "").replace(/\\n/g, "\n");
    if (ex.group === "المتغيرات" && /^(var|let|const)-/.test(ex.id) && !js.includes("document.write")) {
      js += "\n\n// هنا قمنا بطباعة جميع القيم الموجودة في المتغيرات\ndocument.write(name + '<br>');\ndocument.write(age + '<br>');\ndocument.write(isWorking);";
    }
    const title = String(ex.title || "مثال JavaScript").replace(/[<>]/g, "");
    return `<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>${title}</title>\n</head>\n<body>\n    <!-- عنصر تجريبي تستخدمه أمثلة التعامل مع HTML -->\n    <h1>${title}</h1>\n    <p id="demo">سيظهر هنا ناتج المثال عند استخدام عنصر demo.</p>\n\n    <script>\n        // كود المثال الكامل\n${js.split("\n").map(line => "        " + line).join("\n")}\n    </script>\n</body>\n</html>`;
  }
  function isNativeDemo(ex) {
    return ex.id === "start-3" || (ex.code && ex.code.includes("document.write"));
  }
  function getValues(ex) {
    const values = {};
    (ex.fields || []).forEach(f => {
      const input = document.querySelector(`[data-field="${CSS.escape(f.id)}"]`);
      values[f.id] = input ? input.value : (f.value ?? "");
    });
    return values;
  }
  function popupDocument(title, body) {
    const win = window.open("", "js-example-output", "popup=yes,width=760,height=520,resizable=yes,scrollbars=yes");
    if (!win) throw new Error("المتصفح منع النافذة المنبثقة. اسمح بالنوافذ المنبثقة لهذا الملف ثم أعد المحاولة.");
    win.document.open();
    win.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>body{font:17px Tahoma,Arial,sans-serif;padding:32px;color:#202a3c;line-height:1.8}h1{font-size:23px;color:#315fe8;border-bottom:1px solid #e5eaf5;padding-bottom:12px}.content{padding:18px;border:1px solid #e1e7f2;border-radius:12px;background:#f8faff;overflow-wrap:anywhere}.note{color:#7a8498;font-size:12px;margin-top:22px}</style></head><body><h1>${escapeHtml(title)}</h1><div class="content">${body}</div><p class="note">نافذة تجريبية مستقلة لتوضيح سلوك JavaScript. يمكنك إغلاقها والعودة إلى المختبر.</p></body></html>`);
    win.document.close();
    win.focus();
    return win;
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function runExample(ex, options = {}) {
    try {
      const values = getValues(ex);
      if (!options.previewOnly && ex.id === "start-3") {
        // تشغيل alert الحقيقي من المتصفح استجابةً لنقرة المستخدم.
        window.alert(String(values.message ?? ""));
        $("output").innerHTML = '<div class="result-alert"><strong>✓ تم عرض رسالة التنبيه الأصلية من المتصفح.</strong><p>أغلق نافذة التنبيه للعودة إلى المختبر.</p></div>';
        $("errorBox").hidden = true;
        return;
      }
      if (!options.previewOnly && ex.code && ex.code.includes("document.write")) {
        // document.write يكتب في مستند منفصل حتى لا يستبدل صفحة المختبر نفسها.
        const win = window.open("", "js-example-output", "popup=yes,width=760,height=520,resizable=yes,scrollbars=yes");
        if (!win) throw new Error("المتصفح منع النافذة المنبثقة. اسمح بالنوافذ المنبثقة لهذا الملف ثم أعد المحاولة.");
        win.document.open();
        if (ex.id === "start-2") {
          win.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>نتيجة document.write()</title><style>body{font:20px Tahoma,Arial,sans-serif;padding:36px;line-height:1.8}main{padding:22px;border:1px solid #dce5ff;border-radius:12px;background:#f2f6ff}</style></head><body><main>${escapeHtml(values.message)}</main></body></html>`);
        } else {
          const result = ex.run(values);
          win.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>نتيجة document.write()</title><style>body{font:17px Tahoma,Arial,sans-serif;padding:32px;line-height:1.8;color:#202a3c}main{padding:20px;border:1px solid #dce5ff;border-radius:12px;background:#f8faff}</style></head><body><h2>نتيجة تنفيذ المثال</h2><main>${result}</main></body></html>`);
        }
        win.document.close();
        win.focus();
        $("output").innerHTML = '<div class="result-alert"><strong>✓ نُفّذ document.write() داخل صفحة منفصلة.</strong><p>راجع النافذة الجديدة لمشاهدة المحتوى المكتوب، مع بقاء المختبر مفتوحًا.</p></div>';
        $("errorBox").hidden = true;
        return;
      }
      const result = ex.run(values);
      $("output").innerHTML = result;
      $("errorBox").hidden = true;
    } catch (err) {
      $("errorBox").textContent = "تعذر تنفيذ المثال: " + (err && err.message ? err.message : "خطأ غير معروف");
      $("errorBox").hidden = false;
      $("output").textContent = "لم يتم عرض نتيجة بسبب حدوث خطأ.";
    }
  }
  search.addEventListener("input", renderNav);
  $("collapseSidebar").addEventListener("click", () => document.body.classList.toggle("sidebar-collapsed"));
  $("mobileMenu").addEventListener("click", () => $("sidebar").classList.toggle("mobile-open"));
  renderNav(); renderExample(window.EXAMPLES[0]);
})();
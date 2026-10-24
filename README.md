# الاستديو — المعرض العام

موقع GitHub Pages عام مرتبط بخادم Cloudflare المستقل في المستودع الخاص `photo-gallery-admin`.

- الرابط: https://marwanywr3-lab.github.io/photo-gallery/
- الخادم: https://photo-gallery-api-marwanywr3-lab.barboodmarwan.workers.dev
- تخطيط Masonry متجاوب، بحث خادمي في العنوان والوصف والوسوم، وتحميل صفحات متتابعة.
- عرض بيانات الكاميرا فقط عند تفعيلها في الإدارة.
- بطاقة مشاركة JPEG سينمائية 1080×1350 بعلامة مائية وحساب @f_ioc ورابط المعرض.
- تعطيل قائمة الزر الأيمن وسحب الصور واختصار الحفظ ردع واجهي فقط؛ لا يمنع استخراج صورة عُرضت في متصفح الزائر.
- لا مفاتيح API ولا بيانات إدارة في هذا المستودع.

## إنشاء ونشر GitHub Pages عبر CLI

داخل هذا المجلد بعد تسجيل الدخول إلى GitHub:

```powershell
gh auth login --hostname github.com --web --git-protocol https
git init -b main
git add .
git commit -m "Build public photography gallery"
$galleryOwner = (gh api user --jq .login).Trim()
gh repo create "$galleryOwner/photo-gallery" --public --source=. --remote=origin --push
gh api --method POST "repos/$galleryOwner/photo-gallery/pages" -f 'source[branch]=main' -f 'source[path]=/'
```

يستعمل النشر فرع main وجذر المستودع، دون دومين مخصص أو خطوة بناء. إن كان المستودع موجوداً استخدم نسخته وعدّل الملفات ثم `git push` بدلاً من إعادة الإنشاء. حالة النشر:

```powershell
gh api "repos/$galleryOwner/photo-gallery/pages"
gh api "repos/$galleryOwner/photo-gallery/pages/builds/latest"
```

صور المعرض تُدار من قاعدة D1 وتخزين R2؛ لا تُضاف الصور إلى GitHub. إن لم توجد صور منشورة يعرض الموقع حالة فارغة واضحة.


# Honey Yemen — تشغيل جهاز قياس العسل

هذا المستودع يحتوي على واجهة Next.js وخادم Express ووسيط اتصال حقيقي بين الخادم وArduino عبر USB Serial.

**تنبيه الحالة:** تم استبدال مولد القراءات العشوائية في مسار الفحص بقراءة تسلسلية فعلية، وتم إيقاف إصدار حكم أصالة/نقاء أو نسب كيميائية غير مثبتة. المنظومة الحالية تسجل RGB وUV ودرجة حرارة IR فقط. لا تزال هناك أعمال لازمة قبل الإنتاج التجاري أو إصدار شهادة أصالة.

## الأجهزة المدعومة في مسار القراءة الحالي

- TCS34725: قيم RGB الخام.
- GY-ML8511: خرج UV الخام؛ لا يُفترض أنه طول موجي أو HMF.
- GY-906 / MLX90614: درجة حرارة الجسم بالأشعة تحت الحمراء.

يوجد Firmware أولي في `hardware/arduino/HoneyYemenDevice.ino` للحساسات الفعلية، مع تعليمات التوصيل والمكتبات في `hardware/arduino/README.md`. لا يفترض هذا الإصدار وجود NeoSpectra أو AS7341 أو VEML6075 أو MLX90640 أو HX711 أو BME688.

## متطلبات التشغيل على Windows

1. Windows 10/11، Node.js 20، Python 3.10 أو أحدث، Docker Desktop، وتعريف CH340/Arduino.
2. صِل Arduino وتحقق من رقم المنفذ في Device Manager.
3. أغلق Arduino Serial Monitor وأي برنامج آخر يستخدم منفذ COM.
4. انسخ `.env.example` إلى `.env` في جذر المشروع، واستبدل كلمات مرور Docker ورمز InfluxDB بقيم قوية.
5. شغّل البنية المساندة:

```powershell
docker compose up -d
docker compose ps
```

6. انسخ `backend/.env.example` إلى `backend/.env`، وعدّل `HONEY_SERIAL_PORT` إلى منفذ Arduino الفعلي، مثلاً `COM5`.
7. ثبّت وشغّل الخلفية من مجلد المشروع:

```powershell
cd backend
npm ci
python -m pip install -r ..\hardware\requirements.txt
npm run dev
```

8. في نافذة طرفية ثانية، شغّل الواجهة:

```powershell
cd frontend
copy .env.example .env.local
npm ci
npm run dev
```

9. افتح `http://localhost:3000`، ثم اختر محطة المختبر. يجب أن يظهر اتصال الخادم قبل تمكين زر القراءة.

**مهم:** يعمل Backend على Windows host عمداً حتى يستطيع فتح منفذ COM الخاص بـArduino. Docker Desktop لا يمرر منافذ COM إلى حاوية Linux تلقائياً.

## بروتوكول Arduino المطلوب

عند استقبال `START\n`، يجب أن يرسل البرنامج ثلاث رسائل CSV منتهية بسطر جديد، وبسرعة افتراضية 9600:

```text
COLOR_DATA,<red>,<green>,<blue>
UV_DATA,<raw_adc_or_voltage>
IR_DATA,<object_temperature_c>
```

يمكن إرسال الرسائل بأي ترتيب. لا يكتمل الفحص حتى تصل القراءات الثلاث. لا يختلق الخادم قراءة مفقودة، بل ينهي الفحص برسالة خطأ/مهلة.

تفاصيل المنفذ والمعايرة في [hardware/README.md](hardware/README.md).

## حالة التخزين والخدمات

- يظل مخزن JSON الحالي مستخدماً في هذا الإصدار لبيانات التطبيق وسجلات القياس.
- ملفات PostgreSQL وInfluxDB ومخطط Prisma موجودة، لكن تكامل جميع المستودعات والخدمات معها **لم يكتمل بعد**. تشغيل الحاويات وحده لا يعني أن التطبيق يحفظ بياناته فيها.
- لا تضع الخادم على الإنترنت حالياً؛ افتراضي الربط هو `127.0.0.1`.
- يبدأ النظام بترحيل ملف البيانات القديم إلى `backend/data/honey_db.runtime.json` ويصنف نتائجه القديمة كسجلات `DEMO`. لا تُستخدم السجلات القديمة لإثبات الأصالة.
- تم إيقاف تسجيل الدخول التجريبي، وتعديل سجلات SaaS والتاجر والطلبات حتى يكتمل نظام المصادقة والصلاحيات والدفع.
- لا تظهر منتجات السوق إلا عند وجود سجل عينة بحالة `VERIFIED`. لم يتم بناء مسار اعتماد مخبري نهائي بعد.

## ما يلزم قبل الإنتاج الحقيقي

1. ترحيل مخزن JSON إلى PostgreSQL وربط InfluxDB بالقراءات الزمنية، مع migrations ونسخ احتياطي.
2. مصادقة فعلية، إنشاء مدير أول بطريقة آمنة، RBAC وتدقيق العمليات.
3. اعتماد بروتوكول Firmware النهائي للحساسات ومطابقة وحدات UV ومعايرة RGB/IR.
4. بناء مجموعة عينات مرجعية من مختبر موثوق، ثم التحقق الأعمى قبل أي تصنيف للأصالة.
5. إعادة تفعيل التاجر والسوق والطلبات بعد ربط المخزون والدفع والشحن.
6. CI ناجح، اختبارات تكامل على الجهاز الحقيقي، مراجعة أمنية وتشغيل مراقب.

## الاختبارات

```powershell
# Backend TypeScript
cd backend
npm ci
npm run build

# Hardware serial protocol parser
cd ..
python -m pip install -r hardware/requirements.txt
python -m unittest discover -s hardware/tests -v

# Frontend
cd frontend
npm ci
npm run build
```

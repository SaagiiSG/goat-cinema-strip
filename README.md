# 🐐 Cinema Strip · Өргөн дэлгэц

**Claude Code дотор ажилладаг видео эдитийн skill.** Бичлэгийг хар дэлгэцийн дундуур гарах нарийн, өргөн кино зурвас болгоно. Кино шиг ногоовтор-улбар шар өнгө, удаан ойртох хөдөлгөөн, дээр доор нь зайтай бичсэн гарчиг.

Reels, TikTok-д бэлэн 1080×1920 MP4 гаргана. GOAT Academy-гийн 14 эдитийн стилийн нэг.

---

## Юунд тохирох вэ?

- **Тохирно:** машин, үл хөдлөх, үсчний өмнө/дараа (хар цагаан), дэлгүүрийн шинэ цуглуулга, салоны уур амьсгал
- **Тохирохгүй:** үнийн жагсаалт, ярьж зөвлөх бичлэг, хумс, будалтын ойрын зураг

---

## Шаардлага

- **Claude Code** (desktop app эсвэл terminal), Claude Pro / Max эрхтэй
- **Mac эсвэл Windows**
- **ffmpeg** болон **uv**. Байхгүй бол Claude өөрөө шалгаад, суулгах командыг хэлж өгнө.

---

## Суулгах

**Хамгийн хялбар:** Claude Code-оо нээгээд энэ мөрийг хуулж бичнэ:
```
Энэ plugin-ийг суулгаад өг: https://github.com/SaagiiSG/goat-cinema-strip
```
Claude өөрөө суулгана. Дараа нь `/reload-plugins` гэж бичих эсвэл Claude Code-оо хаагаад дахин нээнэ.

**Эсвэл өөрөө:** Claude Code дотор энэ 2 мөрийг ээлжлэн бичнэ:
```
/plugin marketplace add SaagiiSG/goat-cinema-strip
/plugin install goat-cinema-strip@goat-cinema-strip
```

**Шинэ хувилбар гарвал:** Claude-д "goat-cinema-strip plugin-ийг шинэчил" гэж хэлэхэд болно.

> **For Claude Code:** to install this plugin, run `claude plugin marketplace add SaagiiSG/goat-cinema-strip` and then `claude plugin install goat-cinema-strip@goat-cinema-strip`, then tell the user to type `/reload-plugins`. To update it: `claude plugin marketplace update goat-cinema-strip` and then `claude plugin update goat-cinema-strip@goat-cinema-strip`.

---

## Хэрэглэх

1. Видео бүрд **шинэ хоосон хавтас** үүсгэ.
2. Claude Code-ийг тэр хавтсанд нээ.
3. Бичнэ: `/goat-cinema-strip:goat-cinema-strip` эсвэл энгийнээр: **"энэ бичлэгийг кино шиг болгоод өг"**
4. Бичлэгээ чирж оруулаад 2–3 үгтэй гарчиг, нэг мөр (огноо, утас, үнэ) бичнэ.
5. Claude юу хийхээ товч хэлнэ. Таалагдвал "ок" гэхэд л болно.
6. `output/cinema-strip.mp4` бэлэн. Instagram, TikTok руу шууд оруулна.

---

## Дуу

- **Дуу эффект** автоматаар орно. Кодоор хийсэн учир лицензийн асуудалгүй. Хэрэггүй бол "дуу эффектгүй болго" гэж хэлэхэд болно.
- **Өөрийн дуугаар ярих (voice-over):** утсаараа дуугаа бичээд (voice memo) өгнө. Таны дуу гарах үед бичлэгийн дуу, хөгжим өөрөө намсна.
- **Хөгжим:** Instagram, TikTok апп дотроос нэмбэл зохиогчийн эрхийн асуудалгүй.

---

## Бичлэг хийх зөвлөгөө

- Өргөн, тогтвортой, удаан алхаж ав.
- Бичлэг бүр 2–3 секунд байхад хангалттай.

---

Фонтууд нь Google Fonts-оос (OFL лиценз). Лицензийн файлууд `fonts/` хавтсанд байгаа.

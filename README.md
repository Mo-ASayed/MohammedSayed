# MohammedSayed.com

Personal hub for Mohammed Sayed, built for Vercel.

## Local Development

```bash
npm install
npm run dev
```

## DNS Shape

```text
mohammedsayed.com      -> Vercel
www.mohammedsayed.com  -> Vercel
lab.mohammedsayed.com  -> AWS delegated zone
```

## Content Notes

- Replace `public/Mohammed-Sayed-CV.pdf` with the real exported CV PDF.
- Update structured content in `src/app/data.ts`.
- The `/cv` route is print-friendly and can be used as the source of the PDF.

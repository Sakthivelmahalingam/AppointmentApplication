# Carely appointment booking demo

A frontend-only doctor appointment booking prototype built with React and Vite. It uses local sample data; there is no backend, SMS provider, payment gateway, or persistent database.

## Run locally

```powershell
cd D:\AppointmentApplication\DocApp
npm install --legacy-peer-deps
npm run dev
```

Open the local URL printed by Vite in your browser.

## Demo flows

- Search nearby sample hospitals and filter doctors by specialty.
- Select a doctor, choose a date and time, enter patient details, and confirm the booking.
- View the appointment card with a demo QR-style code, appointment ID, and OTP.
- Open **Clinic check-in** and find the booking using its ID or OTP; inspect the patient details, record a sample fee payment, and check the patient in.
- Send a simulated 15-minute delay notice and see it on the appointments page.
- Open **Manage clinic** to add doctors from the 20-department list, create daily appointment slots, block/unblock slots, or move an available slot to another time.
- Select an appointment card to check the patient in, record investigation/procedure details at checkout, and print or save a visit summary as PDF through the browser print dialog.

Doctors, slots, appointments, and simulated actions are stored in `sessionStorage` and last only for the current browser tab session. Booked slots cannot be blocked or moved. The QR-style graphic is illustrative; the OTP and appointment ID are the working demo verification values. No SMS or payment is sent or processed. PDF export uses the browser's print dialog; choose **Save as PDF**.

## Checks

```powershell
npm run lint
npm run build
```

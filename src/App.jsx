import { useEffect, useMemo, useState } from 'react'
import './App.css'

const hospitals = [
  {
    id: 'lakeside',
    name: 'Lakeside Medical Centre',
    area: 'Indiranagar, Bengaluru',
    distance: '1.2 km away',
    rating: '4.9',
    reviews: 284,
    type: 'Multi-specialty',
    color: 'blue',
    doctors: [
      { id: 'ananya', name: 'Dr. Ananya Rao', specialty: 'Cardiologist', experience: '12 years experience', fee: 800, initials: 'AR', color: 'lavender', next: '10:30 AM' },
      { id: 'vikram', name: 'Dr. Vikram Shetty', specialty: 'Dermatologist', experience: '9 years experience', fee: 650, initials: 'VS', color: 'peach', next: '11:15 AM' },
    ],
  },
  {
    id: 'greenwood',
    name: 'Greenwood Family Hospital',
    area: 'HAL 2nd Stage, Bengaluru',
    distance: '2.4 km away',
    rating: '4.8',
    reviews: 196,
    type: 'General hospital',
    color: 'green',
    doctors: [
      { id: 'meera', name: 'Dr. Meera Nair', specialty: 'General Physician', experience: '15 years experience', fee: 500, initials: 'MN', color: 'mint', next: '09:45 AM' },
      { id: 'arjun', name: 'Dr. Arjun Menon', specialty: 'Orthopaedic', experience: '11 years experience', fee: 750, initials: 'AM', color: 'blue', next: '12:00 PM' },
    ],
  },
  {
    id: 'citycare',
    name: 'CityCare Health Hospital',
    area: 'Domlur, Bengaluru',
    distance: '3.1 km away',
    rating: '4.7',
    reviews: 152,
    type: 'Specialty clinic',
    color: 'rose',
    doctors: [
      { id: 'priya', name: 'Dr. Priya Iyer', specialty: 'Pediatrician', experience: '10 years experience', fee: 700, initials: 'PI', color: 'rose', next: '10:00 AM' },
    ],
  },
]

const departments = [
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'ENT',
  'Gastroenterology',
  'General Medicine',
  'General Surgery',
  'Gynecology',
  'Nephrology',
  'Neurology',
  'Oncology',
  'Ophthalmology',
  'Orthopaedics',
  'Paediatrics',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
  'Urology',
  'Dentistry',
  'Physiotherapy',
]
const specialties = ['All doctors', ...departments]
const timeSlots = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM']
const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const appStartDate = new Date()
const STORAGE_KEYS = {
  appointments: 'carely-appointments',
  doctors: 'carely-doctors',
  slots: 'carely-slots',
}

function useSessionStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const saved = window.sessionStorage.getItem(key)
    if (!saved) return initialValue
    try {
      const parsed = JSON.parse(saved)
      return key === STORAGE_KEYS.appointments
        ? parsed.map((appointment) => ({ ...appointment, date: new Date(appointment.date) }))
        : parsed
    } catch (error) {
      console.error(`Could not read ${key} from session storage.`, error)
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Could not save ${key} to session storage.`, error)
    }
  }, [key, value])

  return [value, setValue]
}

function minutesFromTime(time) {
  const match = time.match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/)
  if (!match) return NaN
  let hours = Number(match[1]) % 12
  if (match[3] === 'PM') hours += 12
  return hours * 60 + Number(match[2])
}

function timeFromMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`
}

function timeToInput(time) {
  const minutes = minutesFromTime(time)
  if (!Number.isFinite(minutes)) return ''
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

function inputToTime(value) {
  if (!value) return ''
  const [hours, minutes] = value.split(':').map(Number)
  return timeFromMinutes(hours * 60 + minutes)
}

function dateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const shiftTimes = Array.from({ length: 64 }, (_, index) => timeFromMinutes(6 * 60 + index * 15))

function matchesDepartment(doctorSpecialty, department) {
  if (doctorSpecialty === department) return true
  const aliases = {
    Cardiologist: 'Cardiology',
    Dermatologist: 'Dermatology',
    'General Physician': 'General Medicine',
    Orthopaedic: 'Orthopaedics',
    Pediatrician: 'Paediatrics',
  }
  return aliases[doctorSpecialty] === department
}

function Icon({ name, size = 20 }) {
  const paths = {
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    arrow: <><path d="M5 12h14M12 5l7 7-7 7" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
    close: <path d="m18 6-12 12M6 6l12 12" />,
    check: <path d="m5 12 4 4L19 6" />,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
    hospital: <><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01M10 21v-4h4v4" /><path d="M12 7v4M10 9h4" /></>,
    phone: <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.7L7.7 9.7a16 16 0 0 0 6.6 6.6l1.3-1.3a2 2 0 0 1 1.7-.6l3 .5a2 2 0 0 1 1.7 2Z" /></>,
    filter: <><path d="M4 7h16M7 12h10m-7 5h4" /><circle cx="8" cy="7" r="1" /><circle cx="15" cy="12" r="1" /></>,
  }
  return <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function makeCode(seed) {
  let value = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return Array.from({ length: 121 }, (_, index) => {
    value = (value * 9301 + 49297) % 233280
    const row = Math.floor(index / 11)
    const col = index % 11
    const finder = (r, c) => (r < 3 && c < 3) || (r < 3 && c > 7) || (r > 7 && c < 3)
    if (finder(row, col)) {
      const localRow = row < 3 ? row : row - 8
      const localCol = col < 3 ? col : col - 8
      return localRow === 0 || localRow === 2 || localCol === 0 || localCol === 2 || (localRow === 1 && localCol === 1)
    }
    return value % 2 === 0
  })
}

function QrCode({ value, small = false }) {
  const cells = makeCode(value)
  return <svg className={`qr-code${small ? ' qr-small' : ''}`} viewBox="0 0 11 11" role="img" aria-label="Demo appointment QR code">
    <rect width="11" height="11" fill="white" />
    {cells.map((filled, index) => filled ? <rect key={index} x={index % 11} y={Math.floor(index / 11)} width="1" height="1" fill="#182d49" /> : null)}
  </svg>
}

function App() {
  const [view, setView] = useState('find')
  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState('All doctors')
  const [booking, setBooking] = useState(null)
  const [selectedDate, setSelectedDate] = useState(0)
  const [selectedTime, setSelectedTime] = useState('')
  const [patient, setPatient] = useState({ name: '', phone: '', email: '', reason: '' })
  const [appointments, setAppointments] = useSessionStorage(STORAGE_KEYS.appointments, [])
  const [createdDoctors, setCreatedDoctors] = useSessionStorage(STORAGE_KEYS.doctors, [])
  const [doctorSlots, setDoctorSlots] = useSessionStorage(STORAGE_KEYS.slots, [])
  const [confirmedAppointment, setConfirmedAppointment] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [delaySent, setDelaySent] = useState(false)
  const [verification, setVerification] = useState('')
  const [verifiedAppointment, setVerifiedAppointment] = useState(null)
  const [doctorForm, setDoctorForm] = useState({ name: '', hospitalId: hospitals[0].id, specialty: departments[0], fee: '' })
  const [scheduleForm, setScheduleForm] = useState({ doctorId: '', date: dateKey(appStartDate), start: '09:00 AM', end: '12:00 PM', duration: '30' })
  const [slotDate, setSlotDate] = useState(dateKey(appStartDate))
  const [checkoutForm, setCheckoutForm] = useState({ investigation: '', procedures: '', notes: '' })
  const days = useMemo(() => Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(appStartDate)
    date.setDate(date.getDate() + offset)
    return date
  }), [])

  const allHospitals = hospitals.map((hospital) => ({
    ...hospital,
    doctors: [...hospital.doctors, ...createdDoctors.filter((doctor) => doctor.hospitalId === hospital.id)],
  }))

  const filteredHospitals = allHospitals.map((hospital) => ({
    ...hospital,
    doctors: hospital.doctors.filter((doctor) => (
      (specialty === 'All doctors' || matchesDepartment(doctor.specialty, specialty))
      && `${hospital.name} ${hospital.area} ${doctor.name} ${doctor.specialty}`.toLowerCase().includes(query.toLowerCase())
    )),
  })).filter((hospital) => hospital.doctors.length > 0)

  const allDoctors = allHospitals.flatMap((hospital) => hospital.doctors.map((doctor) => ({ ...doctor, hospital })))
  const scheduleDoctor = allDoctors.find((doctor) => doctor.id === scheduleForm.doctorId)
  const managedSlots = doctorSlots.filter((slot) => slot.date === slotDate && (!scheduleForm.doctorId || slot.doctorId === scheduleForm.doctorId))
  const availableBookingSlots = booking ? (() => {
    const configured = doctorSlots.filter((slot) => slot.doctorId === booking.doctor.id && slot.date === dateKey(days[selectedDate]))
    return configured.length
    ? configured.map((slot) => ({ time: slot.time, blocked: slot.blocked || slot.booked, id: slot.id }))
      : timeSlots.map((time) => ({ time, blocked: time === '09:30 AM' || time === '02:00 PM', id: null }))
  })() : []

  function openBooking(hospital, doctor) {
    setBooking({ hospital, doctor })
    setSelectedDate(0)
    setSelectedTime('')
    setPatient({ name: '', phone: '', email: '', reason: '' })
  }

  function confirmBooking(event) {
    event.preventDefault()
    const chosenSlot = availableBookingSlots.find((slot) => slot.time === selectedTime)
    if (!selectedTime || chosenSlot?.blocked) return
    const appointment = {
      id: `DOC-${String(appointments.length + 1).padStart(6, '0')}`,
      otp: String(100000 + ((appointments.length + 1) * 246813) % 900000),
      hospital: booking.hospital,
      doctor: booking.doctor,
      date: days[selectedDate],
      time: selectedTime,
      slotId: chosenSlot?.id || null,
      patient: { ...patient },
      status: 'Confirmed',
      paid: false,
      checkedInAt: null,
      checkedOutAt: null,
      investigation: '',
      procedures: '',
      notes: '',
    }
    setAppointments((current) => [appointment, ...current])
    if (chosenSlot?.id) {
      setDoctorSlots((current) => current.map((slot) => slot.id === chosenSlot.id ? { ...slot, booked: true } : slot))
    }
    setConfirmedAppointment(appointment)
    setBooking(null)
    setView('appointments')
  }

  function findAppointment(event) {
    event.preventDefault()
    const match = appointments.find((appointment) => appointment.id.toLowerCase() === verification.trim().toLowerCase() || appointment.otp === verification.trim())
    setVerifiedAppointment(match || null)
  }

  function formatDate(date, options = { day: 'numeric', month: 'short' }) {
    return new Intl.DateTimeFormat('en-IN', options).format(date)
  }

  function updateAppointment(updated) {
    setAppointments((current) => current.map((appointment) => appointment.id === updated.id ? updated : appointment))
    setVerifiedAppointment((current) => current?.id === updated.id ? updated : current)
    setSelectedAppointment(updated)
  }

  function createDoctor(event) {
    event.preventDefault()
    const doctor = {
      id: `custom-${createdDoctors.length + 1}`,
      name: doctorForm.name.trim(),
      specialty: doctorForm.specialty,
      experience: 'New to Carely',
      fee: Number(doctorForm.fee),
      initials: doctorForm.name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      color: 'blue',
      next: '09:00 AM',
      hospitalId: doctorForm.hospitalId,
    }
    setCreatedDoctors((current) => [doctor, ...current])
    setScheduleForm((current) => ({ ...current, doctorId: doctor.id }))
    setDoctorForm({ ...doctorForm, name: '', fee: '' })
  }

  function createDailySlots(event) {
    event.preventDefault()
    if (!scheduleForm.doctorId) return
    const start = minutesFromTime(scheduleForm.start)
    const end = minutesFromTime(scheduleForm.end)
    const duration = Number(scheduleForm.duration)
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || duration < 5) return
    const generated = []
    for (let time = start; time + duration <= end; time += duration) {
      const label = timeFromMinutes(time)
      if (!doctorSlots.some((slot) => slot.doctorId === scheduleForm.doctorId && slot.date === scheduleForm.date && slot.time === label)) {
        generated.push({ id: `slot-${doctorSlots.length + generated.length + 1}`, doctorId: scheduleForm.doctorId, date: scheduleForm.date, time: label, blocked: false })
      }
    }
    setDoctorSlots((current) => [...current, ...generated])
    setSlotDate(scheduleForm.date)
  }

  function shiftSlot(slot, time) {
    if (slot.booked || !time || doctorSlots.some((item) => item.id !== slot.id && item.doctorId === slot.doctorId && item.date === slot.date && item.time === time)) return
    setDoctorSlots((current) => current.map((item) => item.id === slot.id ? { ...item, time } : item))
    setAppointments((current) => current.map((appointment) => appointment.slotId === slot.id ? { ...appointment, time } : appointment))
  }

  function openAppointment(appointment) {
    setSelectedAppointment(appointment)
    setCheckoutForm({ investigation: appointment.investigation || '', procedures: appointment.procedures || '', notes: appointment.notes || '' })
  }

  function saveCheckout(event) {
    event.preventDefault()
    if (!selectedAppointment) return
    updateAppointment({
      ...selectedAppointment,
      status: 'Checked out',
      checkedOutAt: new Date().toISOString(),
      investigation: checkoutForm.investigation.trim(),
      procedures: checkoutForm.procedures.trim(),
      notes: checkoutForm.notes.trim(),
    })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); setView('find') }}>
          <span className="brand-mark"><Icon name="plus" size={23} /></span>
          <span>care<span className="brand-accent">ly</span><small>HEALTH, MADE SIMPLE</small></span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={view === 'find' ? 'nav-link active' : 'nav-link'} onClick={() => setView('find')}>Find a doctor</button>
          <button className={view === 'appointments' ? 'nav-link active' : 'nav-link'} onClick={() => setView('appointments')}>My appointments{appointments.length > 0 && <span className="nav-count">{appointments.length}</span>}</button>
          <button className={view === 'manage' ? 'nav-link active' : 'nav-link'} onClick={() => setView('manage')}>Manage clinic</button>
          <button className={view === 'clinic' ? 'nav-link active' : 'nav-link'} onClick={() => setView('clinic')}>Clinic check-in</button>
        </nav>
        <div className="topbar-actions">
          <button className="location-button"><Icon name="pin" size={17} /><span><small>Your location</small>Bengaluru, India</span><span className="location-caret">⌄</span></button>
          <button className="avatar-button" aria-label="Profile">JD</button>
        </div>
      </header>

      <main>
        {view === 'find' && (
          <>
            <section className="hero-section">
              <div className="hero-copy">
                <span className="eyebrow"><span className="eyebrow-dot" /> YOUR HEALTH, YOUR TIME</span>
                <h1>Good health starts<br />with the <span>right care.</span></h1>
                <p>Find trusted doctors near you and book an appointment that fits your day.</p>
                <div className="hero-trust"><span><Icon name="shield" size={17} /> Verified doctors</span><i /><span><Icon name="heart" size={17} /> Care you can trust</span></div>
              </div>
              <div className="hero-art" aria-hidden="true">
                <div className="art-circle" />
                <div className="art-cross cross-one">+</div><div className="art-cross cross-two">+</div>
                <div className="doctor-illustration"><div className="doctor-hair" /><div className="doctor-face"><span /><span /><i /></div><div className="doctor-neck" /><div className="doctor-coat"><div className="coat-collar" /><div className="coat-pocket" /></div><div className="stethoscope" /></div>
                <div className="hero-note"><span className="note-icon"><Icon name="calendar" size={19} /></span><span><strong>Care, on your schedule</strong><small>Appointments made easy</small></span><Icon name="check" size={18} /></div>
              </div>
              <div className="hero-bottom">
                <div className="hero-stat"><strong>250<span>+</span></strong><small>trusted doctors</small></div>
                <div className="hero-stat"><strong>40<span>+</span></strong><small>nearby clinics</small></div>
                <div className="hero-stat"><strong>4.9<span className="stat-star">★</span></strong><small>average patient rating</small></div>
              </div>
            </section>

            <section className="search-section" aria-label="Search for a doctor">
              <div className="search-intro"><span className="section-kicker">FIND YOUR SPECIALIST</span><h2>How can we help you today?</h2></div>
              <div className="search-controls">
                <label className="search-field"><Icon name="search" size={20} /><input aria-label="Search doctors or hospitals" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Doctor, hospital or specialty" /><kbd>⌘ K</kbd></label>
                <label className="search-location"><Icon name="pin" size={19} /><span><small>LOCATION</small><strong>Bengaluru, India</strong></span></label>
                <button className="search-button" onClick={() => document.getElementById('nearby-doctors')?.scrollIntoView({ behavior: 'smooth' })}><Icon name="search" size={18} /> Find care</button>
              </div>
            </section>

            <section className="results-section" id="nearby-doctors">
              <div className="results-heading">
                <div><span className="section-kicker">CARE AROUND YOU</span><h2>Doctors & hospitals nearby <span className="result-total">{filteredHospitals.reduce((sum, hospital) => sum + hospital.doctors.length, 0)}</span></h2></div>
                <button className="filter-button"><Icon name="filter" size={17} /> Filters</button>
              </div>
              <div className="specialty-tabs" aria-label="Filter by specialty">
                {specialties.map((item) => <button key={item} onClick={() => setSpecialty(item)} className={specialty === item ? 'specialty-tab selected' : 'specialty-tab'}>{item}</button>)}
              </div>
              <div className="hospital-list">
                {filteredHospitals.map((hospital) => (
                  <article className="hospital-card" key={hospital.id}>
                    <div className={`hospital-visual ${hospital.color}`}><div className="hospital-building"><div className="building-sign"><Icon name="plus" size={21} /></div><div className="building-windows"><i /><i /><i /><i /><i /><i /></div><div className="building-door" /></div><span className="visual-tag">{hospital.type}</span></div>
                    <div className="hospital-info">
                      <div className="hospital-title-row"><div><h3>{hospital.name}</h3><p><Icon name="pin" size={15} />{hospital.area}<span className="distance-separator">·</span>{hospital.distance}</p></div><span className="rating"><Icon name="star" size={15} />{hospital.rating}<small>({hospital.reviews})</small></span></div>
                      <div className="doctor-list">
                        {hospital.doctors.map((doctor) => (
                          <div className="doctor-row" key={doctor.id}>
                            <div className={`doctor-avatar ${doctor.color}`}>{doctor.initials}<span className="online-dot" /></div>
                            <div className="doctor-details"><strong>{doctor.name}</strong><span>{doctor.specialty}<i />{doctor.experience}</span></div>
                            <div className="doctor-next"><small>NEXT AVAILABLE</small><strong><Icon name="clock" size={14} /> Today, {doctor.next}</strong></div>
                            <div className="doctor-fee"><small>CONSULTATION</small><strong>₹{doctor.fee}</strong></div>
                            <button className="book-button" onClick={() => openBooking(hospital, doctor)}>Book visit <Icon name="arrow" size={16} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
                {filteredHospitals.length === 0 && <div className="empty-state"><span className="empty-icon"><Icon name="search" size={23} /></span><h3>No doctors found</h3><p>Try another name or specialty to find care near you.</p><button onClick={() => { setQuery(''); setSpecialty('All doctors') }}>Clear search</button></div>}
              </div>
              <button className="load-more" onClick={() => { setQuery(''); setSpecialty('All doctors') }}>Showing all available doctors <Icon name="check" size={16} /></button>
            </section>
          </>
        )}

        {view === 'appointments' && (
          <section className="page-section">
            <div className="page-heading"><div><span className="section-kicker">YOUR CARE, ALL IN ONE PLACE</span><h1>My appointments<span>.</span></h1><p>Manage your upcoming visits and keep your confirmation handy.</p></div><button className="primary-button" onClick={() => setView('find')}><Icon name="plus" size={18} /> Book an appointment</button></div>
            {delaySent && <div className="notice-banner"><span className="notice-icon"><Icon name="bell" size={19} /></span><div><strong>Clinic update: appointments are running 15 minutes late.</strong><p>Your clinic has shared an updated wait time. Thank you for your patience.</p></div><button aria-label="Dismiss notice" onClick={() => setDelaySent(false)}><Icon name="close" size={18} /></button></div>}
            {appointments.length ? <div className="appointment-list">
              {appointments.map((appointment) => <article className="appointment-card clickable" key={appointment.id} role="button" tabIndex={0} onClick={() => openAppointment(appointment)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openAppointment(appointment) } }}>
                <div className="appointment-date"><span>{weekday[appointment.date.getDay()]}</span><strong>{appointment.date.getDate()}</strong><small>{monthNames[appointment.date.getMonth()].slice(0, 3)}</small></div>
                <div className="appointment-main"><div className="appointment-status"><span className="status-dot" />{appointment.status} <span>·</span> {appointment.id}</div><h3>{appointment.doctor.name}</h3><p>{appointment.doctor.specialty} <i /> {appointment.hospital.name}</p><div className="appointment-meta"><span><Icon name="clock" size={16} />{appointment.time}</span><span><Icon name="pin" size={16} />{appointment.hospital.area}</span></div></div>
                <div className="appointment-ticket"><QrCode value={appointment.id} small /><div><small>SHOW AT CLINIC</small><strong>{appointment.otp}</strong><button onClick={(event) => { event.stopPropagation(); setVerification(appointment.otp); setView('clinic') }}>View check-in code <Icon name="chevron" size={14} /></button></div></div>
              </article>)}
              {confirmedAppointment && <div className="confirmed-hint"><Icon name="check" size={17} /> Your latest appointment is confirmed. The demo QR and OTP are ready for clinic check-in.</div>}
            </div> : <div className="empty-state appointments-empty"><span className="empty-icon"><Icon name="calendar" size={24} /></span><h3>No appointments yet</h3><p>Your booked visits will appear here with their check-in QR and one-time code.</p><button onClick={() => setView('find')}>Find a doctor <Icon name="arrow" size={16} /></button></div>}
          </section>
        )}

        {view === 'manage' && (
          <section className="page-section">
            <div className="page-heading"><div><span className="section-kicker">CLINIC ADMIN · SESSION ONLY</span><h1>Manage doctors & slots<span>.</span></h1><p>Create doctors and daily appointment slots, then block, unblock, or move an individual slot.</p></div><span className="demo-label"><span /> SESSION STORAGE</span></div>
            <div className="manage-grid">
              <section className="clinic-panel manage-create-panel">
                <div className="panel-title"><div><span className="panel-icon"><Icon name="user" size={19} /></span><div><h2>Add a doctor</h2><p>Doctor records are kept for this browser session.</p></div></div></div>
                <form className="manage-form" onSubmit={createDoctor}>
                  <label>Doctor name<input required value={doctorForm.name} onChange={(event) => setDoctorForm({ ...doctorForm, name: event.target.value })} placeholder="e.g. Dr. Asha Kumar" /></label>
                  <label>Hospital<select value={doctorForm.hospitalId} onChange={(event) => setDoctorForm({ ...doctorForm, hospitalId: event.target.value })}>{hospitals.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}</select></label>
                  <label>Department / specialization<select value={doctorForm.specialty} onChange={(event) => setDoctorForm({ ...doctorForm, specialty: event.target.value })}>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                  <label>Consultation fee (₹)<input required type="number" min="0" value={doctorForm.fee} onChange={(event) => setDoctorForm({ ...doctorForm, fee: event.target.value })} placeholder="e.g. 600" /></label>
                  <button className="primary-button" type="submit"><Icon name="plus" size={17} /> Save doctor</button>
                </form>
                <div className="doctor-records"><div className="manage-subheading"><strong>Doctors</strong><span>{allDoctors.length} total</span></div>{allDoctors.map(({ hospital, ...doctor }) => <div className="doctor-record" key={doctor.id}><span className={`doctor-avatar ${doctor.color}`}>{doctor.initials}</span><span><strong>{doctor.name}</strong><small>{doctor.specialty} · {hospital.name}</small></span><strong>₹{doctor.fee}</strong></div>)}</div>
              </section>

              <section className="clinic-panel manage-slots-panel">
                <div className="panel-title"><div><span className="panel-icon"><Icon name="calendar" size={19} /></span><div><h2>Daily slot schedule</h2><p>Generate appointment times for a doctor and date.</p></div></div></div>
                <form className="manage-form slot-create-form" onSubmit={createDailySlots}>
                  <label>Doctor<select required value={scheduleForm.doctorId} onChange={(event) => setScheduleForm({ ...scheduleForm, doctorId: event.target.value })}><option value="">Select a doctor</option>{allDoctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name} · {doctor.hospital.name}</option>)}</select></label>
                  <label>Schedule date<input type="date" required value={scheduleForm.date} onChange={(event) => setScheduleForm({ ...scheduleForm, date: event.target.value })} /></label>
                  <div className="slot-form-row"><label>Start time<input type="time" required value={timeToInput(scheduleForm.start)} onChange={(event) => setScheduleForm({ ...scheduleForm, start: inputToTime(event.target.value) })} /></label><label>End time<input type="time" required value={timeToInput(scheduleForm.end)} onChange={(event) => setScheduleForm({ ...scheduleForm, end: inputToTime(event.target.value) })} /></label></div>
                  <label>Minutes per appointment<select value={scheduleForm.duration} onChange={(event) => setScheduleForm({ ...scheduleForm, duration: event.target.value })}><option value="15">15 minutes</option><option value="20">20 minutes</option><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option></select></label>
                  <button className="primary-button" type="submit" disabled={!scheduleForm.doctorId}><Icon name="plus" size={17} /> Generate daily slots</button>
                </form>
                <div className="slot-list-heading"><div className="manage-subheading"><strong>Slots for the day</strong><span>{managedSlots.length} scheduled</span></div><label className="slot-date-filter">Date<input type="date" value={slotDate} onChange={(event) => setSlotDate(event.target.value)} /></label></div>
                {managedSlots.length ? <div className="managed-slot-list">{managedSlots.sort((a, b) => minutesFromTime(a.time) - minutesFromTime(b.time)).map((slot) => <div className={`managed-slot ${slot.blocked ? 'blocked' : ''}`} key={slot.id}><span className="slot-time"><Icon name="clock" size={15} />{slot.time}</span><span className={`slot-status ${slot.blocked ? 'is-blocked' : ''}`}>{slot.booked ? 'Booked' : slot.blocked ? 'Blocked' : 'Available'}</span><div className="slot-actions"><label className="slot-shift-label">Move to<select aria-label={`Move ${slot.time} slot to`} value="" disabled={slot.booked} onChange={(event) => shiftSlot(slot, event.target.value)}><option value="" disabled>Shift</option>{shiftTimes.filter((time) => !doctorSlots.some((item) => item.id !== slot.id && item.doctorId === slot.doctorId && item.date === slot.date && item.time === time)).map((time) => <option key={time} value={time}>{time}</option>)}</select></label><button disabled={slot.booked} className={slot.blocked ? 'slot-toggle unblock' : 'slot-toggle'} onClick={() => setDoctorSlots((current) => current.map((item) => item.id === slot.id ? { ...item, blocked: !item.blocked } : item))}>{slot.blocked ? 'Unblock' : 'Block'}</button></div></div>)}</div> : <div className="no-managed-slots"><Icon name="calendar" size={21} /><span>{scheduleDoctor && scheduleDoctor.id === scheduleForm.doctorId ? `No slots configured for ${formatDate(new Date(`${slotDate}T00:00:00`), { day: 'numeric', month: 'short', year: 'numeric' })}. Generate a schedule above.` : 'Select a doctor and generate their daily slots.'}</span></div>}
              </section>
            </div>
          </section>
        )}

        {view === 'clinic' && (
          <section className="page-section">
            <div className="page-heading"><div><span className="section-kicker">CLINIC FRONT DESK · DEMO</span><h1>Patient check-in<span>.</span></h1><p>Look up a sample booking by appointment ID or OTP, then confirm the patient’s details.</p></div><span className="demo-label"><span /> SAMPLE CLINIC PORTAL</span></div>
            <div className="clinic-grid">
              <div className="clinic-main">
                <div className="clinic-panel"><div className="panel-title"><div><span className="panel-icon"><Icon name="shield" size={19} /></span><div><h2>Verify appointment</h2><p>Ask the patient for their QR code, appointment ID or OTP.</p></div></div><span className="demo-pill">DEMO ONLY</span></div>
                  <form className="verify-form" onSubmit={findAppointment}><label htmlFor="verify-code">Appointment ID or 6-digit OTP</label><div className="verify-input-row"><input id="verify-code" value={verification} onChange={(event) => { setVerification(event.target.value); setVerifiedAppointment(null) }} placeholder="e.g. DOC-123456 or 482915" /><button className="primary-button" type="submit"><Icon name="search" size={17} /> Find booking</button></div><small>Bookings made in this demo are stored only in this browser session.</small></form>
                  {verification && !verifiedAppointment && <div className="verify-result empty-verify"><Icon name="search" size={19} /><span>{appointments.length ? 'No matching appointment yet. Check the ID or OTP and try again.' : 'Book a sample appointment first, then use its OTP or ID here.'}</span></div>}
                  {verifiedAppointment && <div className="patient-result"><div className="verified-heading"><span><Icon name="check" size={17} /></span><div><strong>Appointment verified</strong><small>{verifiedAppointment.id} · {verifiedAppointment.status}</small></div><span className="verified-badge">VERIFIED</span></div><div className="patient-card-content"><div className="patient-avatar">{verifiedAppointment.patient.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div><div className="patient-fields"><div><small>PATIENT</small><strong>{verifiedAppointment.patient.name}</strong></div><div><small>PHONE</small><strong>{verifiedAppointment.patient.phone}</strong></div><div><small>DOCTOR</small><strong>{verifiedAppointment.doctor.name}</strong></div><div><small>VISIT</small><strong>{formatDate(verifiedAppointment.date, { day: 'numeric', month: 'short', year: 'numeric' })} · {verifiedAppointment.time}</strong></div><div className="patient-reason"><small>REASON FOR VISIT</small><strong>{verifiedAppointment.patient.reason || 'Not specified'}</strong></div></div><QrCode value={verifiedAppointment.id} small /></div><div className="payment-row"><span><strong>Consultation fee</strong><small>{verifiedAppointment.paid ? 'Payment recorded in this demo' : 'Collect payment at the clinic'}</small></span><strong>₹{verifiedAppointment.doctor.fee}</strong><div className="clinic-actions"><button className={verifiedAppointment.paid ? 'paid-button' : ''} onClick={() => { const updated = { ...verifiedAppointment, paid: !verifiedAppointment.paid }; setVerifiedAppointment(updated); setAppointments((current) => current.map((appointment) => appointment.id === updated.id ? updated : appointment)) }}>{verifiedAppointment.paid ? <><Icon name="check" size={15} /> Fee paid</> : 'Mark fee paid'}</button><button onClick={() => { const updated = { ...verifiedAppointment, status: 'Checked in', checkedInAt: verifiedAppointment.checkedInAt || new Date().toISOString() }; setVerifiedAppointment(updated); setAppointments((current) => current.map((appointment) => appointment.id === updated.id ? updated : appointment)) }}>{verifiedAppointment.status === 'Checked in' || verifiedAppointment.status === 'Checked out' ? <><Icon name="check" size={15} /> Checked in</> : <>Check in <Icon name="arrow" size={14} /></>}</button></div></div></div>}
                </div>
              </div>
              <aside className="clinic-sidebar"><div className="delay-panel"><span className="panel-icon warm"><Icon name="bell" size={19} /></span><h3>Running behind?</h3><p>Send a 15-minute delay update to all booked patients. This is a local demo notification.</p><div className="delay-preview"><span className="delay-preview-icon"><Icon name="clock" size={16} /></span><span><strong>Clinic running 15 min late</strong><small>Sent to today's patients</small></span><span className="preview-dot" /></div><button className={delaySent ? 'delay-button sent' : 'delay-button'} onClick={() => { setDelaySent(true); setView('appointments') }}>{delaySent ? <><Icon name="check" size={16} /> Update sent</> : <><Icon name="bell" size={16} /> Send delay update</>}</button></div><div className="clinic-help"><Icon name="hospital" size={20} /><div><strong>Using the demo</strong><p>Book a visit, then return here and enter the OTP shown on your appointment card.</p></div></div></aside>
            </div>
          </section>
        )}
      </main>

      <footer className="site-footer"><div className="footer-brand"><span className="brand-mark"><Icon name="plus" size={20} /></span><strong>care<span>ly</span></strong></div><span>Better care begins with a simple appointment.</span><small>© 2025 Carely · Frontend demo with sample data</small></footer>

      {selectedAppointment && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedAppointment(null) }}><section className="booking-modal appointment-detail-modal" role="dialog" aria-modal="true" aria-labelledby="appointment-detail-title">
        <div className="modal-header"><div><span className="section-kicker">APPOINTMENT DETAILS · {selectedAppointment.id}</span><h2 id="appointment-detail-title">{selectedAppointment.patient.name}</h2></div><button className="modal-close" aria-label="Close appointment details" onClick={() => setSelectedAppointment(null)}><Icon name="close" size={20} /></button></div>
        <div className="detail-summary"><div className="patient-avatar">{selectedAppointment.patient.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div><div className="detail-summary-copy"><strong>{selectedAppointment.doctor.name}</strong><span>{selectedAppointment.doctor.specialty} · {selectedAppointment.hospital.name}</span><small>{formatDate(selectedAppointment.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {selectedAppointment.time}</small></div><span className="detail-status">{selectedAppointment.status}</span></div>
        <div className="detail-info-grid"><div><small>MOBILE</small><strong>{selectedAppointment.patient.phone}</strong></div><div><small>EMAIL</small><strong>{selectedAppointment.patient.email || 'Not provided'}</strong></div><div><small>REASON FOR VISIT</small><strong>{selectedAppointment.patient.reason || 'Not specified'}</strong></div><div><small>FEE</small><strong>₹{selectedAppointment.doctor.fee} · {selectedAppointment.paid ? 'Paid' : 'Unpaid'}</strong></div></div>
        <div className="visit-actions"><div><strong>Visit status</strong><span>{selectedAppointment.checkedInAt ? `Checked in ${new Date(selectedAppointment.checkedInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Patient has not checked in yet'}</span></div><div className="detail-buttons"><button className="secondary-button" disabled={selectedAppointment.status === 'Checked in' || selectedAppointment.status === 'Checked out'} onClick={() => updateAppointment({ ...selectedAppointment, status: 'Checked in', checkedInAt: new Date().toISOString() })}>{selectedAppointment.checkedInAt ? <><Icon name="check" size={15} /> Checked in</> : 'Check in'}</button><button className="secondary-button" onClick={() => window.print()}><Icon name="calendar" size={15} /> Print / Save PDF</button></div></div>
        <form className="checkout-form" onSubmit={saveCheckout}><div className="checkout-heading"><div><strong>Checkout & visit notes</strong><span>Record investigations and procedures before completing the visit.</span></div>{selectedAppointment.status === 'Checked out' && <span className="checkout-done"><Icon name="check" size={14} /> Completed</span>}</div><label>Investigation details<textarea rows="2" value={checkoutForm.investigation} onChange={(event) => setCheckoutForm({ ...checkoutForm, investigation: event.target.value })} placeholder="Tests requested or results..." /></label><label>Procedures performed<textarea rows="2" value={checkoutForm.procedures} onChange={(event) => setCheckoutForm({ ...checkoutForm, procedures: event.target.value })} placeholder="Procedure and treatment details..." /></label><label>Additional notes<textarea rows="2" value={checkoutForm.notes} onChange={(event) => setCheckoutForm({ ...checkoutForm, notes: event.target.value })} placeholder="Follow-up and care instructions..." /></label><div className="checkout-footer"><span>{selectedAppointment.checkedInAt ? 'Checkout saves these details to this browser session.' : 'Check the patient in before completing checkout.'}</span><button className="primary-button" type="submit" disabled={!selectedAppointment.checkedInAt || selectedAppointment.status === 'Checked out'}>{selectedAppointment.status === 'Checked out' ? 'Visit checked out' : 'Save & check out'} <Icon name="check" size={16} /></button></div></form>
      </section></div>}

      {selectedAppointment && <section className="print-sheet" aria-hidden="true"><div className="print-brand">Carely <span>Appointment summary</span></div><h1>Patient visit record</h1><div className="print-grid"><p><strong>Patient:</strong> {selectedAppointment.patient.name}</p><p><strong>Phone:</strong> {selectedAppointment.patient.phone}</p><p><strong>Doctor:</strong> {selectedAppointment.doctor.name}</p><p><strong>Department:</strong> {selectedAppointment.doctor.specialty}</p><p><strong>Hospital:</strong> {selectedAppointment.hospital.name}</p><p><strong>Appointment:</strong> {formatDate(selectedAppointment.date, { day: 'numeric', month: 'long', year: 'numeric' })} at {selectedAppointment.time}</p><p><strong>Appointment ID:</strong> {selectedAppointment.id}</p><p><strong>Reason:</strong> {selectedAppointment.patient.reason || 'Not specified'}</p></div><h2>Investigation details</h2><p className="print-notes">{selectedAppointment.investigation || 'No investigation details recorded.'}</p><h2>Procedures performed</h2><p className="print-notes">{selectedAppointment.procedures || 'No procedures recorded.'}</p><h2>Additional notes</h2><p className="print-notes">{selectedAppointment.notes || 'No additional notes.'}</p><footer>Generated from the Carely appointment demo.</footer></section>}

      {booking && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setBooking(null) }}><section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <div className="modal-header"><div><span className="section-kicker">BOOK YOUR VISIT</span><h2 id="booking-title">Choose a time</h2></div><button className="modal-close" aria-label="Close booking" onClick={() => setBooking(null)}><Icon name="close" size={20} /></button></div>
        <div className="booking-doctor"><div className={`doctor-avatar ${booking.doctor.color}`}>{booking.doctor.initials}</div><div><strong>{booking.doctor.name}</strong><span>{booking.doctor.specialty} · {booking.hospital.name}</span></div><strong className="booking-fee">₹{booking.doctor.fee}</strong></div>
        <form onSubmit={confirmBooking}>
          <fieldset className="date-picker"><legend><Icon name="calendar" size={17} /> Select a date</legend><div className="date-options">{days.map((date, index) => <button type="button" key={date.toISOString()} onClick={() => setSelectedDate(index)} className={selectedDate === index ? 'date-option chosen' : 'date-option'}><span>{index === 0 ? 'Today' : weekday[date.getDay()]}</span><strong>{date.getDate()}</strong><small>{monthNames[date.getMonth()].slice(0, 3)}</small></button>)}</div></fieldset>
          <fieldset className="time-picker"><legend><Icon name="clock" size={17} /> Available times</legend><div className="time-options">{availableBookingSlots.map((slot) => <button type="button" key={slot.id || slot.time} disabled={slot.blocked} onClick={() => setSelectedTime(slot.time)} className={`${selectedTime === slot.time ? 'chosen ' : ''}${slot.blocked ? 'unavailable' : ''}`}>{slot.time}{slot.blocked ? ' · Unavailable' : ''}</button>)}</div></fieldset>
          <div className="form-divider" /><div className="patient-form-heading"><span className="section-kicker">PATIENT DETAILS</span><small>All fields marked * are required</small></div>
          <div className="form-grid"><label>Full name *<input required value={patient.name} onChange={(event) => setPatient({ ...patient, name: event.target.value })} placeholder="Enter your full name" /></label><label>Mobile number *<input required type="tel" pattern="[0-9+() -]{8,15}" value={patient.phone} onChange={(event) => setPatient({ ...patient, phone: event.target.value })} placeholder="+91 98765 43210" /></label><label>Email address<input type="email" value={patient.email} onChange={(event) => setPatient({ ...patient, email: event.target.value })} placeholder="you@example.com" /></label><label>Reason for visit<input value={patient.reason} onChange={(event) => setPatient({ ...patient, reason: event.target.value })} placeholder="Briefly describe your concern" /></label></div>
          <div className="modal-footer"><span><Icon name="shield" size={16} /> Your details stay private in this demo</span><button className="primary-button" type="submit" disabled={!selectedTime}>Confirm appointment <Icon name="arrow" size={16} /></button></div>
        </form>
      </section></div>}
    </div>
  )
}

export default App

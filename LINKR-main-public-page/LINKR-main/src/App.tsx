import { useEffect, useRef, useState } from 'react'

// Change this one value to point every order button somewhere else.
const ORDER_URL = 'https://linkr-founder.vercel.app/'

const NAV = [
  { label: 'Product', href: '#product' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'FAQ', href: '#faq' },
]

const PLATFORMS = ['Instagram', 'TikTok', 'LinkedIn', 'Facebook'] as const
type Platform = (typeof PLATFORMS)[number]

const NAME = 'Juan Dela Cruz'

function Avatar({ size, ring }: { size: number; ring?: string }) {
  return (
    <div className="shrink-0 rounded-full p-[2px]" style={{ width: size, height: size, background: ring ?? 'transparent' }}>
      <div className="grid h-full w-full place-items-center rounded-full border-2 border-white bg-gradient-to-br from-[#3a3a3a] to-[#111] text-[0.7rem] font-bold text-white">
        JD
      </div>
    </div>
  )
}

function ProfileScreen({ platform }: { platform: Platform }) {
  if (platform === 'Instagram')
    return (
      <div className="h-full bg-white px-3 pt-9 text-[#000] font-[system-ui]">
        <div className="flex items-center justify-between text-[0.72rem] font-bold">
          <span>juandelacruz ⌄</span>
          <span className="tracking-widest">⋯</span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Avatar size={58} ring="linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)" />
          <div className="flex flex-1 justify-around text-center text-[0.55rem] leading-tight">
            <div><b className="block text-[0.72rem]">128</b>posts</div>
            <div><b className="block text-[0.72rem]">2,418</b>followers</div>
            <div><b className="block text-[0.72rem]">512</b>following</div>
          </div>
        </div>
        <p className="mt-2 text-[0.62rem] font-semibold">{NAME}</p>
        <p className="text-[0.58rem] leading-snug text-black/70">Manila, PH · Coffee and film photos</p>
        <div className="mt-2.5 grid grid-cols-2 gap-1 text-[0.6rem] font-semibold">
          <div className="rounded-md bg-[#0095f6] py-1.5 text-center text-white">Follow</div>
          <div className="rounded-md bg-[#efefef] py-1.5 text-center">Message</div>
        </div>
        <div className="mt-3 flex justify-around border-t border-black/10 pt-1.5 text-[0.6rem]">
          <span className="border-b border-black px-3 pb-1">▦</span>
          <span className="px-3 pb-1 text-black/40">▷</span>
          <span className="px-3 pb-1 text-black/40">◎</span>
        </div>
        <div className="grid grid-cols-3 gap-[2px]">
          {Array.from({ length: 9 }).map((_, k) => (
            <div key={k} className="aspect-square" style={{ background: `hsl(${20 + k * 12} 12% ${78 - (k % 3) * 8}%)` }} />
          ))}
        </div>
      </div>
    )

  if (platform === 'TikTok')
    return (
      <div className="flex h-full flex-col items-center bg-white pt-9 text-center text-[#161823] font-[system-ui]">
        <p className="text-[0.7rem] font-bold">{NAME}</p>
        <div className="mt-3"><Avatar size={64} /></div>
        <p className="mt-2 text-[0.66rem] font-semibold">@juandelacruz</p>
        <div className="mt-2.5 flex gap-4 text-[0.55rem] text-black/50">
          <div><b className="block text-[0.72rem] text-black">64</b>Following</div>
          <div><b className="block text-[0.72rem] text-black">3.4K</b>Followers</div>
          <div><b className="block text-[0.72rem] text-black">9.1K</b>Likes</div>
        </div>
        <div className="mt-3 flex gap-1 text-[0.62rem] font-semibold">
          <div className="rounded-sm bg-[#fe2c55] px-7 py-1.5 text-white">Follow</div>
          <div className="rounded-sm bg-[#f1f1f2] px-2 py-1.5">✉</div>
        </div>
        <p className="mt-2 text-[0.56rem] text-black/70">daily vlogs from Quezon City 🇵🇭</p>
        <div className="mt-3 flex w-full justify-around border-b border-black/10 text-[0.62rem]">
          <span className="border-b-2 border-black px-4 pb-1">|||</span>
          <span className="px-4 pb-1 text-black/35">♡</span>
        </div>
        <div className="grid w-full grid-cols-3 gap-[1px]">
          {Array.from({ length: 6 }).map((_, k) => (
            <div key={k} className="relative aspect-[3/4]" style={{ background: `hsl(${200 + k * 20} 10% ${30 + (k % 3) * 10}%)` }}>
              <span className="absolute bottom-0.5 left-1 text-[0.45rem] text-white">▷ {((k + 2) * 1.3).toFixed(1)}K</span>
            </div>
          ))}
        </div>
      </div>
    )

  if (platform === 'LinkedIn')
    return (
      <div className="h-full bg-[#f4f2ee] text-[#191919] font-[system-ui]">
        <div className="flex items-center gap-2 bg-white px-3 pb-2 pt-8">
          <span className="grid h-4 w-4 place-items-center rounded-[3px] bg-[#0a66c2] text-[0.5rem] font-bold text-white">in</span>
          <span className="h-4 flex-1 rounded bg-[#edf3f8]" />
        </div>
        <div className="bg-white pb-3">
          <div className="h-14 bg-gradient-to-r from-[#a0b4c8] to-[#c9d6e2]" />
          <div className="-mt-8 px-3"><Avatar size={60} /></div>
          <div className="px-3">
            <p className="mt-1 text-[0.78rem] font-semibold">{NAME}</p>
            <p className="text-[0.56rem] leading-snug">Marketing Associate · Makati City</p>
            <p className="mt-0.5 text-[0.52rem] text-black/55">Metro Manila, Philippines</p>
            <p className="mt-1 text-[0.54rem] font-semibold text-[#0a66c2]">500+ connections</p>
            <div className="mt-2.5 flex gap-1.5 text-[0.6rem] font-semibold">
              <div className="flex-1 rounded-full bg-[#0a66c2] py-1.5 text-center text-white">+ Connect</div>
              <div className="flex-1 rounded-full border border-[#0a66c2] py-1.5 text-center text-[#0a66c2]">Message</div>
            </div>
          </div>
        </div>
        <div className="mt-2 bg-white px-3 py-2.5">
          <p className="text-[0.64rem] font-semibold">About</p>
          <p className="mt-1 text-[0.54rem] leading-snug text-black/65">Brand and growth. Always happy to connect over coffee in BGC.</p>
        </div>
      </div>
    )

  return (
    <div className="h-full bg-white text-[#050505] font-[system-ui]">
      <div className="flex items-center justify-between px-3 pb-1.5 pt-8">
        <span className="text-[0.85rem] font-bold text-[#0866ff]">facebook</span>
        <span className="text-[0.6rem] text-black/50">⌕</span>
      </div>
      <div className="relative h-20 bg-gradient-to-br from-[#cfd6de] to-[#9fb0c0]" />
      <div className="-mt-10 flex justify-center"><Avatar size={72} /></div>
      <div className="px-3 text-center">
        <p className="mt-1.5 text-[0.82rem] font-bold">{NAME}</p>
        <p className="text-[0.56rem] text-black/55"><b className="text-black">1.2K</b> friends</p>
        <div className="mt-2.5 flex gap-1.5 text-[0.6rem] font-semibold">
          <div className="flex-1 rounded-md bg-[#0866ff] py-1.5 text-white">Add friend</div>
          <div className="flex-1 rounded-md bg-[#e4e6eb] py-1.5">Message</div>
        </div>
      </div>
      <div className="mt-3 flex gap-1.5 border-t border-black/10 px-3 pt-2 text-[0.56rem] font-semibold">
        <span className="rounded-full bg-[#ebf5ff] px-2 py-1 text-[#0866ff]">Posts</span>
        <span className="px-2 py-1 text-black/55">About</span>
        <span className="px-2 py-1 text-black/55">Photos</span>
      </div>
      <div className="px-3 pt-2 text-[0.54rem] leading-relaxed text-black/65">
        <p>🏠 Lives in Pasig City</p>
        <p>📍 From Batangas</p>
      </div>
    </div>
  )
}

const FAQS = [
  ['What is LINKR?', 'LINKR is an NFC card that lets people access your chosen online profile by tapping the card with a compatible smartphone.'],
  ['Do I need an app?', "No. The person using the card generally doesn't need a LINKR app. Their phone simply reads the NFC tag and opens the programmed link."],
  ['What can I put on my card?', 'For LINKR Basic, you can choose one social-media profile or online URL.'],
  ['Can I change the profile later?', 'The card is programmed when your order is prepared. Contact LINKR if you need to change the programmed link.'],
  ['Does every phone work?', 'NFC support and behavior vary by device. Most modern NFC-enabled smartphones can interact with compatible NFC tags.'],
  ['How do I order?', 'Send LINKR a message to place your order and confirm current product options.'],
]

function OrderButton({ className = '', children = 'GET YOUR LINKR' }: { className?: string; children?: React.ReactNode }) {
  return (
    <a href={ORDER_URL} target="_blank" rel="noopener" className={`btn ${className}`}>
      {children}
      <span aria-hidden="true">→</span>
    </a>
  )
}

function Card({ className = '' }: { className?: string }) {
  return (
    <div className={`matte aspect-[1.586] rounded-[18px] border border-line ${className}`}>
      <span className="absolute inset-0 grid place-items-center text-[0.8rem] font-bold tracking-[0.42em] text-paper/80 pl-[0.42em]">
        LINKR
      </span>
    </div>
  )
}

function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null)
  const [still, setStill] = useState(false)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection || {}
    const saveData = conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || '')
    if (reduce || saveData) {
      video.pause()
      video.preload = 'none'
      setStill(true)
      return
    }
    const tryPlay = () => {
      const p = video.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    }
    video.muted = true
    tryPlay()
    document.addEventListener('touchstart', tryPlay, { once: true, passive: true })
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tryPlay() : video.pause()), { threshold: 0.05 })
    io.observe(video)
    const onVis = () => (document.hidden ? video.pause() : tryPlay())
    document.addEventListener('visibilitychange', onVis)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      document.removeEventListener('touchstart', tryPlay)
    }
  }, [])

  if (still) return null
  return (
    <video
      ref={ref}
      className="hero__video"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      disablePictureInPicture
      {...{ disableRemotePlayback: true }}
    >
      <source src="/assets/hero-landscape.mp4" type="video/mp4" />
    </video>
  )
}

function Header() {
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`site-header ${solid || open ? 'is-solid' : ''}`}>
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-5 md:h-20 md:px-10">
        <a href="#hero" className="text-[0.95rem] font-extrabold tracking-[0.34em]" aria-label="LINKR home">
          LINKR
        </a>
        <nav className="hidden items-center gap-10 md:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="text-sm text-paper/70 transition-colors hover:text-paper">
              {n.label}
            </a>
          ))}
          <a
            href={ORDER_URL}
            target="_blank"
            rel="noopener"
            className="rounded-full border border-paper/25 px-5 py-2 text-xs font-bold tracking-[0.14em] transition hover:bg-paper hover:text-ink"
          >
            ORDER NOW
          </a>
        </nav>
        <button
          className="relative h-10 w-10 md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className={`absolute left-2 right-2 h-px bg-paper transition ${open ? 'top-1/2 rotate-45' : 'top-[15px]'}`} />
          <span className={`absolute left-2 right-2 h-px bg-paper transition ${open ? 'top-1/2 -rotate-45' : 'top-[24px]'}`} />
        </button>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 px-5 pb-8 md:hidden">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-b border-line py-4 text-2xl font-bold">
              {n.label}
            </a>
          ))}
          <OrderButton className="mt-6 w-full">ORDER NOW</OrderButton>
        </nav>
      )}
    </header>
  )
}

function TapDemo() {
  const [i, setI] = useState(0)
  const p = PLATFORMS[i]
  return (
    <div className="relative mx-auto flex h-[520px] w-full max-w-[520px] items-center justify-center">
      <div className="absolute inset-x-10 bottom-6 h-24 rounded-[50%] bg-accent/5 blur-3xl" />
      {/* phone */}
      <div key={i} className="contents">
      <div className="relative h-[460px] w-[228px] rounded-[42px] border border-white/10 bg-[#0b0b0b] p-[9px] shadow-[0_40px_80px_-30px_rgba(0,0,0,1),inset_0_0_0_1px_rgba(255,255,255,.04)]">
        <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-[#030303]">
          <div className="absolute left-1/2 top-2.5 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
          <div className="tap-screen absolute inset-0 bg-white">
            <div className="tap-profile h-full overflow-hidden">
              <ProfileScreen platform={p} />
            </div>
          </div>
        </div>
        {/* NFC pulse at the top of the phone, where the reader lives */}
        <div className="pointer-events-none absolute left-1/2 top-[22%] h-32 w-32 -translate-x-1/2 -translate-y-1/2">
          <span className="tap-ring absolute inset-0 rounded-full border border-accent/60" />
          <span className="tap-ring r2 absolute inset-0 rounded-full border border-accent/40" />
        </div>
      </div>
      {/* card */}
      <div className="tap-card absolute left-1/2 top-[14%] w-[210px]">
        <Card />
      </div>
      </div>
      <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 gap-1 rounded-full border border-line bg-surface p-1">
        {PLATFORMS.map((pl, k) => (
          <button
            key={pl}
            onClick={() => setI(k)}
            className={`rounded-full px-3 py-1.5 text-[0.7rem] font-semibold transition ${k === i ? 'bg-paper text-ink' : 'text-mute hover:text-paper'}`}
          >
            {pl}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))),
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const wrap = 'mx-auto w-full max-w-[1320px] px-5 md:px-10'

  return (
    <>
      <Header />
      <main>
        {/* HERO */}
        <section id="hero" className="hero">
          <HeroVideo />
          <div className="hero__overlay" />
          <div className={`hero__content ${wrap}`}>
            <div className="max-w-[46rem]">
              <h1 className="display reveal" style={{ transitionDelay: '80ms' }}>
                YOUR IDENTITY.
                <br />
                <span className="text-paper/55">ONE TAP AWAY.</span>
              </h1>
              <p className="reveal mt-7 max-w-[32rem] text-[clamp(1rem,1.4vw,1.15rem)] leading-relaxed text-paper/75" style={{ transitionDelay: '160ms' }}>
                A simple NFC card that instantly connects people to your profile. Just tap, and you're connected.
              </p>
              <div className="reveal mt-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8" style={{ transitionDelay: '240ms' }}>
                <OrderButton className="w-full sm:w-auto" />
                <div className="flex items-baseline gap-4 sm:border-l sm:border-line sm:pl-8">
                  <span className="text-xs leading-tight text-mute">
                    LINKR Basic
                    <br />
                    No app required.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCT INTRO */}
        <section id="product" className="py-28 md:py-40">
          <div className={`${wrap} grid gap-16 md:grid-cols-[1.1fr_1fr] md:gap-24`}>
            <div>
              <h2 className="heading reveal">
                YOUR PROFILE,
                <br />
                IN YOUR POCKET.
              </h2>
              <p className="reveal mt-8 max-w-md text-lg leading-relaxed text-mute">
                LINKR turns a simple card into a digital connection point. Instead of telling someone your username or asking
                them to search for you, just tap.
              </p>
            </div>
            <div className="flex flex-col justify-end">
              {[
                ['Tap', 'One simple tap starts the connection.'],
                ['Open', 'Your chosen profile opens instantly.'],
                ['Connect', 'Share your identity without the awkward search.'],
              ].map(([t, d]) => (
                <div key={t} className="reveal group flex items-baseline justify-between gap-6 border-t border-line py-7 last:border-b">
                  <span className="text-3xl font-extrabold tracking-tight transition-colors group-hover:text-accent md:text-4xl">{t}.</span>
                  <span className="max-w-[15rem] text-right text-sm text-mute">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TAP DEMO */}
        <section id="experience" className="relative overflow-hidden border-y border-line bg-surface py-28 md:py-36">
          <div className={`${wrap} grid items-center gap-16 lg:grid-cols-2`}>
            <div>
              <h2 className="heading reveal">
                ONE TAP.
                <br />
                THAT'S IT.
              </h2>
              <div className="reveal mt-10 space-y-1 text-xl text-paper/40 md:text-2xl">
                <p className="line-through decoration-paper/25">No searching.</p>
                <p className="line-through decoration-paper/25">No typing usernames.</p>
                <p className="line-through decoration-paper/25">No exchanging links manually.</p>
                <p className="pt-4 font-bold text-paper">Just tap your LINKR.</p>
              </div>
            </div>
            <div className="reveal">
              <TapDemo />
            </div>
          </div>
        </section>


        {/* FEATURES */}
        <section id="features" className="pb-28 md:pb-40">
          <div className={wrap}>
            <div className="flex flex-col justify-between gap-6 border-t border-line pt-10 md:flex-row md:items-end">
              <h2 className="heading reveal">SIMPLE BY DESIGN.</h2>
              <p className="reveal max-w-xs text-mute">One card. One profile. Zero hassle.</p>
            </div>
            <div className="mt-14 grid gap-4 md:grid-cols-6">
              {[
                ['NFC enabled', 'Built with NFC technology so compatible smartphones can interact with your LINKR card instantly.', 'md:col-span-4'],
                ['One tap', 'No QR scanning. No typing. No complicated setup.', 'md:col-span-2'],
                ['Personal', 'Your LINKR is programmed specifically for your profile.', 'md:col-span-2'],
                ['No app required', "Your customer doesn't need to install a special app just to use your card.", 'md:col-span-4'],
              ].map(([t, d, span]) => (
                <article
                  key={t}
                  className={`reveal group relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[24px] border border-line bg-surface p-8 transition-colors hover:border-white/15 md:p-10 ${span}`}
                >
                  <span className="h-2 w-2 rounded-full bg-accent/70 transition group-hover:shadow-[0_0_0_6px_rgba(168,199,255,.12)]" />
                  <div>
                    <h3 className="text-2xl font-extrabold tracking-tight uppercase md:text-3xl">{t}</h3>
                    <p className="mt-3 max-w-md leading-relaxed text-mute">{d}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="border-t border-line py-28 md:py-40">
          <div className={wrap}>
            <h2 className="heading reveal">
              FROM ORDER
              <br />
              TO CONNECTION.
            </h2>
            <div className="mt-16 grid gap-0 md:grid-cols-3">
              {[
                ['Order', 'Choose LINKR Basic and provide the social-media profile you want your card to open.'],
                ['Program', 'We program your profile link directly onto the NFC card.'],
                ['Tap', 'Receive your LINKR, tap it against a compatible phone, and connect.'],
              ].map(([t, d], k) => (
                <div key={t} className="reveal relative border-t border-line py-10 md:pr-10" style={{ transitionDelay: `${k * 90}ms` }}>
                  <span className="absolute -top-[5px] left-0 h-[9px] w-[9px] rounded-full border border-paper/40 bg-ink" />
                  <div className="flex items-center gap-3">
                    <h3 className="text-4xl font-extrabold tracking-tight">{t}</h3>
                    {k < 2 && <span className="text-2xl text-paper/25">→</span>}
                  </div>
                  <p className="mt-4 max-w-xs leading-relaxed text-mute">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING + SPECS */}
        <section id="pricing" className="bg-surface py-28 md:py-40">
          <div className={wrap}>
            <h2 className="heading reveal text-center">START WITH ONE TAP.</h2>
            <div className="mt-16 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
              <div className="reveal relative overflow-hidden rounded-[28px] border border-line bg-ink p-8 md:p-12">
                <div className="flex flex-col gap-12 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="label">LINKR Basic</p>
                    <p className="mt-4 text-base font-semibold text-paper/75">Message LINKR to order.</p>
                  </div>
                  <Card className="float w-full max-w-[240px] rotate-[-8deg] self-center sm:mt-6" />
                </div>
                <ul className="mt-10 grid gap-3 text-paper/80 sm:grid-cols-2">
                  {['NFC networking card', 'Matte-black PVC', 'One social profile', 'NFC programming included'].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <span className="h-px w-4 bg-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                  <OrderButton />
                  <p className="text-sm text-mute">Simple. Personal. Ready to tap.</p>
                </div>
              </div>

              <div className="reveal rounded-[28px] border border-line p-8 md:p-12">
                <h3 className="text-2xl font-extrabold tracking-tight">BUILT TO BE SIMPLE.</h3>
                <dl className="mt-8">
                  {[
                    ['Material', 'PVC'],
                    ['Finish', 'Matte Black'],
                    ['Technology', 'NFC'],
                    ['Profile', '1 social profile'],
                    ['Programming', 'Included'],
                    ['Ordering', 'Message LINKR'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-line py-4 text-sm">
                      <dt className="text-mute">{k}</dt>
                      <dd className="font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-6 text-xs text-mute">NFC functionality depends on smartphone compatibility.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FUTURE */}
        <section className="py-28 md:py-36">
          <div className={wrap}>
            <div className="flex items-end justify-between gap-6">
              <h2 className="heading reveal">MORE WAYS TO CONNECT.</h2>
            </div>
            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {[
                ['LINKR Profile', 'One tap. All your links.'],
                ['LINKR Key', 'Your profile, on your keys.'],
                ['LINKR Metal', 'Built different.'],
              ].map(([t, d]) => (
                <div key={t} className="reveal rounded-[24px] border border-dashed border-white/10 p-8 opacity-70">
                  <span className="label !text-[0.62rem]">Coming soon</span>
                  <h3 className="mt-10 text-xl font-bold text-paper/80">{t}</h3>
                  <p className="mt-2 text-mute">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-line py-28 md:py-40">
          <div className={`${wrap} grid gap-12 md:grid-cols-[1fr_1.6fr]`}>
            <h2 className="heading reveal">QUESTIONS?</h2>
            <div className="reveal">
              {FAQS.map(([q, a], k) => (
                <details key={q} className="group border-b border-line" open={k === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-lg font-semibold transition-colors hover:text-accent">
                    {q}
                    <span className="relative h-3 w-3 shrink-0">
                      <span className="absolute top-1/2 h-px w-3 bg-current" />
                      <span className="absolute top-1/2 h-px w-3 rotate-90 bg-current transition group-open:rotate-0" />
                    </span>
                  </summary>
                  <p className="max-w-xl pb-7 leading-relaxed text-mute">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section id="order" className="relative overflow-hidden bg-surface py-32 text-center md:py-48">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[54rem] w-[54rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.03]" />
          <div className={`${wrap} relative`}>
            <h2 className="display reveal">
              READY TO
              <br />
              CONNECT?
            </h2>
            <p className="reveal mt-8 text-lg text-mute">Get your LINKR today.</p>
            <div className="reveal mt-10">
              <OrderButton />
            </div>
            <p className="label reveal mt-14">Tap. Connect. Share.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-line pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-16">
        <div className={`${wrap} grid gap-12 md:grid-cols-[2fr_1fr_1fr]`}>
          <div>
            <p className="text-lg font-extrabold tracking-[0.34em]">LINKR</p>
            <p className="mt-3 text-sm text-mute">Your identity. One tap away.</p>
          </div>
          <ul className="space-y-2 text-sm text-mute">
            {[...NAV, { label: 'Order', href: ORDER_URL }].map((n) => (
              <li key={n.label}>
                <a href={n.href} className="hover:text-paper">{n.label}</a>
              </li>
            ))}
          </ul>
          <ul className="space-y-2 text-sm text-mute">
            {['Instagram', 'Facebook', 'TikTok'].map((s) => (
              <li key={s}>
                <a href="#" className="hover:text-paper">{s}</a>
              </li>
            ))}
          </ul>
        </div>
        <div className={`${wrap} mt-16 flex justify-between text-xs text-mute`}>
          <span>© 2026 LINKR</span>
        </div>
      </footer>
    </>
  )
}

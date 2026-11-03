import React, { useEffect, useState } from "react";
import {
  Sparkles,
  BookOpen,
  Palette,
  Video,
  Bot,
  ArrowRight,
  Rocket,
  Wand2,
  Stars,
  Zap,
} from "lucide-react";

export default function WelcomePage({ onExplore }) {
  const [entering, setEntering] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouse = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;

      setMouse({ x, y });
    };

    window.addEventListener("mousemove", handleMouse);

    return () => {
      window.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  const enterPlotCraft = () => {
    setEntering(true);

    setTimeout(() => {
      onExplore();
    }, 1200);
  };

  return (
    <div
      className={`pc-screen ${entering ? "pc-entering" : ""}`}
    >
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          overflow-x: hidden;
          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          background: #05020f;
        }

        /* =========================================
           MAIN BACKGROUND
        ========================================= */

        .pc-screen {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          color: white;

          background:
            radial-gradient(
              circle at 50% 45%,
              rgba(119, 43, 255, .35),
              transparent 27%
            ),
            radial-gradient(
              circle at 10% 10%,
              rgba(0, 229, 255, .18),
              transparent 28%
            ),
            radial-gradient(
              circle at 90% 20%,
              rgba(255, 0, 153, .2),
              transparent 25%
            ),
            radial-gradient(
              circle at 50% 100%,
              rgba(255, 204, 0, .12),
              transparent 28%
            ),
            #05020f;

          transition:
            transform 1.2s cubic-bezier(.7,0,.2,1),
            opacity 1.2s ease;
        }

        .pc-screen::before {
          content: "";
          position: absolute;
          inset: 0;

          background-image:
            radial-gradient(
              white 1px,
              transparent 1px
            );

          background-size: 55px 55px;
          opacity: .12;
          animation: starsMove 30s linear infinite;
          pointer-events: none;
        }

        .pc-screen::after {
          content: "";
          position: absolute;
          inset: 0;

          background:
            linear-gradient(
              120deg,
              transparent 35%,
              rgba(255,255,255,.035),
              transparent 65%
            );

          pointer-events: none;
        }

        /* =========================================
           EXIT ANIMATION
        ========================================= */

        .pc-entering {
          transform: scale(2.8);
          opacity: 0;
        }

        .pc-entering .pc-portal {
          transform: scale(8);
          opacity: 1;
        }

        /* =========================================
           TOP NAV
        ========================================= */

        .pc-nav {
          width: min(1250px, 92%);
          margin: auto;

          height: 85px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          position: relative;
          z-index: 30;

          animation: navAppear .9s ease both;
        }

        .pc-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pc-logo {
          width: 48px;
          height: 48px;

          border-radius: 15px;

          display: grid;
          place-items: center;

          background:
            linear-gradient(
              135deg,
              #7b2cff,
              #ff1493
            );

          box-shadow:
            0 0 25px rgba(156, 47, 255, .65),
            inset 0 1px rgba(255,255,255,.5);

          animation: logoFloat 3s ease-in-out infinite;
        }

        .pc-brand-name {
          font-size: 24px;
          font-weight: 950;
          letter-spacing: -1px;
        }

        .pc-brand-name span {
          color: #ff4fc3;
        }

        .pc-nav-pill {
          display: flex;
          align-items: center;
          gap: 8px;

          padding: 9px 15px;

          border-radius: 999px;

          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.12);

          backdrop-filter: blur(20px);

          color: #c8c2df;

          font-size: 12px;
          font-weight: 800;
        }

        .pc-live {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #45ffbd;

          box-shadow:
            0 0 10px #45ffbd,
            0 0 20px #45ffbd;

          animation: live 1.4s infinite;
        }

        /* =========================================
           HERO
        ========================================= */

        .pc-hero {
          width: min(1250px, 92%);
          min-height: calc(100vh - 85px);

          margin: auto;

          display: grid;
          grid-template-columns: .85fr 1.15fr;

          align-items: center;

          gap: 30px;

          position: relative;
          z-index: 10;
        }

        .pc-left {
          animation: leftIn 1s .1s cubic-bezier(.2,.8,.2,1) both;
        }

        .pc-small-title {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          padding: 8px 13px;

          border-radius: 999px;

          background: rgba(255,255,255,.055);

          border: 1px solid rgba(255,255,255,.12);

          color: #bcb5d7;

          font-size: 11px;
          font-weight: 850;

          box-shadow:
            inset 0 0 20px rgba(255,255,255,.02);
        }

        .pc-small-title svg {
          color: #ffe600;

          filter:
            drop-shadow(0 0 8px #ffe600);
        }

        .pc-heading {
          margin: 24px 0 0;

          font-size: clamp(52px, 6vw, 82px);

          line-height: .9;

          letter-spacing: -5px;

          font-weight: 1000;

          max-width: 650px;
        }

        .pc-heading .white {
          display: block;
        }

        .pc-heading .neon {
          display: block;

          background:
            linear-gradient(
              90deg,
              #8c4dff,
              #ff24c8,
              #00eaff
            );

          -webkit-background-clip: text;
          color: transparent;

          filter:
            drop-shadow(0 0 25px rgba(255,40,200,.2));

          animation: neonText 3s ease-in-out infinite;
        }

        .pc-heading .yellow {
          display: block;

          background:
            linear-gradient(
              90deg,
              #fff000,
              #ffb000
            );

          -webkit-background-clip: text;
          color: transparent;
        }

        .pc-description {
          max-width: 570px;

          margin: 27px 0;

          color: #a8a1c0;

          font-size: 16px;

          line-height: 1.7;

          font-weight: 500;
        }

        /* =========================================
           BUTTON
        ========================================= */

        .pc-actions {
          display: flex;
          align-items: center;
          gap: 15px;

          flex-wrap: wrap;
        }

        .pc-enter-button {
          position: relative;

          border: none;

          cursor: pointer;

          padding: 16px 24px;

          border-radius: 18px;

          display: flex;
          align-items: center;
          gap: 10px;

          color: white;

          font-size: 15px;
          font-weight: 950;

          overflow: hidden;

          background:
            linear-gradient(
              135deg,
              #7437ff,
              #f000a8
            );

          box-shadow:
            0 0 20px rgba(176,45,255,.5),
            0 15px 45px rgba(90,20,150,.4);

          transition: .3s ease;
        }

        .pc-enter-button::before {
          content: "";

          position: absolute;

          width: 30px;
          height: 200%;

          top: -50%;
          left: -70px;

          transform: rotate(25deg);

          background:
            linear-gradient(
              transparent,
              rgba(255,255,255,.8),
              transparent
            );

          animation: shine 2.8s infinite;
        }

        .pc-enter-button:hover {
          transform:
            translateY(-5px)
            scale(1.04);

          box-shadow:
            0 0 35px rgba(224,37,255,.7),
            0 20px 55px rgba(90,20,150,.55);
        }

        .pc-enter-button svg {
          transition: .3s;
        }

        .pc-enter-button:hover svg {
          transform:
            translateX(5px)
            rotate(-8deg);
        }

        .pc-note {
          color: #77708f;
          font-size: 11px;
          font-weight: 750;
        }

        /* =========================================
           RIGHT 3D WORLD
        ========================================= */

        .pc-right {
          height: 650px;

          display: grid;
          place-items: center;

          position: relative;

          animation:
            rightIn 1.2s .15s
            cubic-bezier(.2,.8,.2,1)
            both;
        }

        .pc-world {
          width: 570px;
          height: 570px;

          position: relative;

          transform:
            translate(
              calc(var(--mx, 0) * 10px),
              calc(var(--my, 0) * 10px)
            );
        }

        /* BIG GLOW */

        .pc-big-glow {
          position: absolute;

          width: 400px;
          height: 400px;

          left: 50%;
          top: 50%;

          transform: translate(-50%,-50%);

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(142,47,255,.45),
              rgba(255,0,177,.2) 40%,
              transparent 70%
            );

          filter: blur(25px);

          animation: bigGlow 4s ease-in-out infinite;
        }

        /* ORBITS */

        .pc-orbit {
          position: absolute;

          left: 50%;
          top: 50%;

          transform:
            translate(-50%,-50%);

          border-radius: 50%;

          border:
            1px solid rgba(180,130,255,.18);

          box-shadow:
            0 0 25px rgba(135,55,255,.08);

          animation:
            orbitRotate linear infinite;
        }

        .pc-orbit.o1 {
          width: 510px;
          height: 510px;
          animation-duration: 25s;
        }

        .pc-orbit.o2 {
          width: 390px;
          height: 390px;
          animation-duration: 18s;
          animation-direction: reverse;
        }

        .pc-orbit.o3 {
          width: 285px;
          height: 285px;
          animation-duration: 13s;
        }

        /* CENTER PLANET */

        .pc-planet {
          position: absolute;

          left: 50%;
          top: 50%;

          width: 245px;
          height: 245px;

          transform:
            translate(-50%,-50%);

          border-radius: 50%;

          background:
            radial-gradient(
              circle at 30% 25%,
              #fff 0 3%,
              transparent 4%
            ),
            radial-gradient(
              circle at 70% 35%,
              #00eaff 0 5%,
              transparent 6%
            ),
            radial-gradient(
              circle at 30% 70%,
              #ff32bd 0 8%,
              transparent 9%
            ),
            radial-gradient(
              circle at 50% 45%,
              #8b3dff,
              #3d13a8 55%,
              #15072d 100%
            );

          box-shadow:
            inset -25px -20px 45px rgba(0,0,0,.5),
            inset 15px 15px 35px rgba(255,255,255,.22),
            0 0 35px rgba(132,43,255,.7),
            0 0 100px rgba(205,34,255,.35);

          animation:
            planetFloat 4s ease-in-out infinite;
        }

        .pc-planet::before {
          content: "";

          position: absolute;

          inset: -25px;

          border-radius: 50%;

          border:
            2px solid rgba(0,238,255,.3);

          transform:
            rotateX(70deg)
            rotateZ(-15deg);

          box-shadow:
            0 0 20px rgba(0,238,255,.25);
        }

        .pc-planet::after {
          content: "";

          position: absolute;

          width: 80px;
          height: 80px;

          right: 25px;
          top: 20px;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(255,255,255,.2),
              transparent 70%
            );

          filter: blur(4px);
        }

        /* AI FACE */

        .pc-ai {
          position: absolute;

          left: 50%;
          top: 50%;

          transform:
            translate(-50%,-50%);

          width: 130px;
          height: 105px;

          border-radius: 35px;

          background:
            linear-gradient(
              145deg,
              #ffffff,
              #e8dcff
            );

          box-shadow:
            0 20px 45px rgba(0,0,0,.25),
            inset 0 1px white;

          z-index: 5;

          animation:
            aiFloat 3s ease-in-out infinite;
        }

        .pc-ai-antenna {
          position: absolute;

          width: 4px;
          height: 28px;

          top: -28px;
          left: 50%;

          transform: translateX(-50%);

          background: #00eaff;
        }

        .pc-ai-antenna::after {
          content: "";

          position: absolute;

          width: 12px;
          height: 12px;

          border-radius: 50%;

          top: -8px;
          left: -4px;

          background: #00eaff;

          box-shadow:
            0 0 10px #00eaff,
            0 0 25px #00eaff;
        }

        .pc-eye {
          position: absolute;

          width: 17px;
          height: 24px;

          top: 30px;

          border-radius: 50%;

          background: #571cff;

          box-shadow:
            0 0 10px #8b4dff;
        }

        .pc-eye.left {
          left: 30px;
        }

        .pc-eye.right {
          right: 30px;
        }

        .pc-smile {
          position: absolute;

          width: 35px;
          height: 17px;

          left: 47px;
          top: 59px;

          border-bottom:
            4px solid #ff32a9;

          border-radius:
            0 0 30px 30px;
        }

        /* =========================================
           FLOATING FEATURE BALLS
        ========================================= */

        .pc-feature {
          position: absolute;

          z-index: 15;

          display: flex;
          align-items: center;
          gap: 10px;

          padding: 10px 13px;

          border-radius: 17px;

          background:
            rgba(17,10,38,.78);

          border:
            1px solid rgba(255,255,255,.14);

          backdrop-filter: blur(18px);

          box-shadow:
            0 15px 35px rgba(0,0,0,.3);

          color: white;

          font-size: 11px;
          font-weight: 900;

          animation:
            featureFloat 4s ease-in-out infinite;
        }

        .pc-feature-icon {
          width: 38px;
          height: 38px;

          border-radius: 13px;

          display: grid;
          place-items: center;
        }

        .pc-story {
          left: 10px;
          top: 90px;
        }

        .pc-story .pc-feature-icon {
          color: #ffe000;

          background:
            rgba(255,210,0,.15);

          box-shadow:
            0 0 20px rgba(255,210,0,.15);
        }

        .pc-image {
          right: 5px;
          top: 45px;

          animation-delay: -.8s;
        }

        .pc-image .pc-feature-icon {
          color: #ff35c5;

          background:
            rgba(255,40,190,.14);

          box-shadow:
            0 0 20px rgba(255,40,190,.15);
        }

        .pc-video {
          right: -10px;
          bottom: 105px;

          animation-delay: -1.5s;
        }

        .pc-video .pc-feature-icon {
          color: #00eaff;

          background:
            rgba(0,234,255,.13);

          box-shadow:
            0 0 20px rgba(0,234,255,.15);
        }

        .pc-chat {
          left: 5px;
          bottom: 70px;

          animation-delay: -2.2s;
        }

        .pc-chat .pc-feature-icon {
          color: #9b65ff;

          background:
            rgba(139,65,255,.15);

          box-shadow:
            0 0 20px rgba(139,65,255,.15);
        }

        /* =========================================
           FLOATING STARS
        ========================================= */

        .pc-star {
          position: absolute;

          z-index: 20;

          animation:
            starFloat 3s ease-in-out infinite;
        }

        .pc-star.s1 {
          top: 45px;
          left: 235px;
          color: #ffe600;
        }

        .pc-star.s2 {
          top: 190px;
          right: 25px;
          color: #00eaff;
          animation-delay: -.7s;
        }

        .pc-star.s3 {
          bottom: 35px;
          left: 220px;
          color: #ff2fbe;
          animation-delay: -1.4s;
        }

        /* =========================================
           PORTAL
        ========================================= */

        .pc-portal {
          position: absolute;

          width: 120px;
          height: 120px;

          left: 50%;
          top: 50%;

          transform:
            translate(-50%,-50%)
            scale(0);

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              white,
              #00eaff 15%,
              #8b3dff 35%,
              #ff19bb 60%,
              transparent 72%
            );

          z-index: 100;

          opacity: 0;

          transition:
            transform 1.2s cubic-bezier(.2,.8,.1,1),
            opacity .3s;
        }

        /* =========================================
           FOOTER
        ========================================= */

        .pc-footer {
          position: absolute;

          bottom: 18px;
          left: 50%;

          transform: translateX(-50%);

          z-index: 30;

          display: flex;
          align-items: center;
          gap: 8px;

          color: #635b7b;

          font-size: 10px;
          font-weight: 800;

          white-space: nowrap;
        }

        /* =========================================
           ANIMATIONS
        ========================================= */

        @keyframes navAppear {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes leftIn {
          from {
            opacity: 0;
            transform: translateX(-60px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes rightIn {
          from {
            opacity: 0;
            transform: translateX(70px) scale(.8);
          }

          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes logoFloat {
          0%,100% {
            transform: translateY(0) rotate(0);
          }

          50% {
            transform: translateY(-5px) rotate(4deg);
          }
        }

        @keyframes live {
          0%,100% {
            opacity: 1;
            transform: scale(1);
          }

          50% {
            opacity: .4;
            transform: scale(1.7);
          }
        }

        @keyframes starsMove {
          from {
            transform: translateY(0);
          }

          to {
            transform: translateY(-55px);
          }
        }

        @keyframes neonText {
          0%,100% {
            filter:
              drop-shadow(0 0 0 rgba(255,0,200,0));
          }

          50% {
            filter:
              drop-shadow(0 0 22px rgba(255,0,200,.35));
          }
        }

        @keyframes shine {
          0% {
            left: -80px;
          }

          40%,100% {
            left: 120%;
          }
        }

        @keyframes bigGlow {
          0%,100% {
            transform:
              translate(-50%,-50%)
              scale(.9);
          }

          50% {
            transform:
              translate(-50%,-50%)
              scale(1.15);
          }
        }

        @keyframes orbitRotate {
          from {
            transform:
              translate(-50%,-50%)
              rotate(0deg);
          }

          to {
            transform:
              translate(-50%,-50%)
              rotate(360deg);
          }
        }

        @keyframes planetFloat {
          0%,100% {
            transform:
              translate(-50%,-50%)
              translateY(0);
          }

          50% {
            transform:
              translate(-50%,-50%)
              translateY(-12px);
          }
        }

        @keyframes aiFloat {
          0%,100% {
            transform:
              translate(-50%,-50%)
              translateY(0)
              rotate(0);
          }

          50% {
            transform:
              translate(-50%,-50%)
              translateY(-7px)
              rotate(2deg);
          }
        }

        @keyframes featureFloat {
          0%,100% {
            transform:
              translateY(0)
              rotate(0);
          }

          50% {
            transform:
              translateY(-11px)
              rotate(1deg);
          }
        }

        @keyframes starFloat {
          0%,100% {
            transform:
              scale(.8)
              rotate(0);
            opacity: .5;
          }

          50% {
            transform:
              scale(1.3)
              rotate(25deg);
            opacity: 1;
          }
        }

        /* =========================================
           RESPONSIVE
        ========================================= */

        @media (max-width: 1000px) {

          .pc-hero {
            grid-template-columns: 1fr;
            text-align: center;

            padding-top: 30px;
            padding-bottom: 80px;
          }

          .pc-left {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .pc-description {
            margin-left: auto;
            margin-right: auto;
          }

          .pc-actions {
            justify-content: center;
          }

          .pc-right {
            height: 570px;
          }
        }

        @media (max-width: 620px) {

          .pc-nav {
            height: 70px;
          }

          .pc-logo {
            width: 42px;
            height: 42px;
          }

          .pc-brand-name {
            font-size: 20px;
          }

          .pc-nav-pill {
            display: none;
          }

          .pc-heading {
            font-size: 48px;
            letter-spacing: -3px;
          }

          .pc-description {
            font-size: 14px;
            line-height: 1.65;
          }

          .pc-right {
            height: 430px;
            margin-top: -20px;
          }

          .pc-world {
            transform: scale(.66);
          }

          .pc-footer {
            display: none;
          }
        }

      `}</style>

      {/* NAVBAR */}
      <header className="pc-nav">
        <div className="pc-brand">
          <div className="pc-logo">
            <Sparkles size={24} />
          </div>

          <div className="pc-brand-name">
            Plot<span>Craft.AI</span>
          </div>
        </div>

        <div className="pc-nav-pill">
          <span className="pc-live" />
          AI Creative Universe
        </div>
      </header>

      {/* HERO */}
      <main className="pc-hero">

        {/* LEFT CONTENT */}
        <section className="pc-left">

          <div className="pc-small-title">
            <Stars size={14} />
            YOUR IMAGINATION HAS NO LIMITS
          </div>

          <h1 className="pc-heading">
            <span className="white">
              Imagine.
            </span>

            <span className="neon">
              Create.
            </span>

            <span className="yellow">
              Explore.
            </span>
          </h1>

          <p className="pc-description">
            Welcome to PlotCraft.AI — your creative AI universe.
            Build incredible stories, create images, make videos,
            write code, learn new things and chat with your AI companion.
          </p>

          <div className="pc-actions">

            <button
              className="pc-enter-button"
              onClick={enterPlotCraft}
            >
              <Rocket size={19} />

              Enter PlotCraft.ai

              <ArrowRight size={18} />
            </button>

            <span className="pc-note">
              ✨ Your next idea starts here
            </span>

          </div>

        </section>

        {/* RIGHT WORLD */}
        <section className="pc-right">

          <div
            className="pc-world"
            style={{
              "--mx": mouse.x,
              "--my": mouse.y,
            }}
          >

            <div className="pc-big-glow" />

            {/* ORBITS */}
            <div className="pc-orbit o1" />
            <div className="pc-orbit o2" />
            <div className="pc-orbit o3" />

            {/* STORY */}
            <div className="pc-feature pc-story">
              <div className="pc-feature-icon">
                <BookOpen size={18} />
              </div>

              Story Magic
            </div>

            {/* IMAGE */}
            <div className="pc-feature pc-image">
              <div className="pc-feature-icon">
                <Palette size={18} />
              </div>

              AI Images
            </div>

            {/* VIDEO */}
            <div className="pc-feature pc-video">
              <div className="pc-feature-icon">
                <Video size={18} />
              </div>

              AI Videos
            </div>

            {/* CHAT */}
            <div className="pc-feature pc-chat">
              <div className="pc-feature-icon">
                <Bot size={18} />
              </div>

              Super AI Chat
            </div>

            {/* STARS */}
            <Stars
              className="pc-star s1"
              size={50}
              fill="currentColor"
            />

            <Sparkles
              className="pc-star s2"
              size={25}
            />

            <Wand2
              className="pc-star s3"
              size={28}
            />

            {/* PLANET */}
            <div className="pc-planet">

              <div className="pc-ai">

                <div className="pc-ai-antenna" />

                <div className="pc-eye left" />
                <div className="pc-eye right" />

                <div className="pc-smile" />

              </div>

            </div>

            {/* ENTER PORTAL */}
            <div className="pc-portal" />

          </div>

        </section>

      </main>

      <footer className="pc-footer">
        <Zap size={12} />
        Imagine • Create • Learn • Discover
      </footer>

    </div>
  );
}


















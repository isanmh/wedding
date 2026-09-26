// script.js — logika utama halaman undangan (di luar galeri foto).
// Logika galeri (masonry, carousel 3D, lightbox, cache gambar) ada di gallery.js

// ===== Buka Undangan (transisi cover) =====
      let isOpeningInvitation = false;

      function bukaUndangan() {
        if (isOpeningInvitation) return;
        isOpeningInvitation = true;

        const cover = document.getElementById("cover-screen");
        const body = document.body;
        const btnAudio = document.getElementById("btn-audio");

        // phase 1: fade inner cover content
        cover.classList.add("cover-exit-start");

        // aktifkan sound background otomatis (memakai gesture klik user)
        const audioPlayer = document.getElementById("audio-player");
        const audioIcon = document.getElementById("audio-icon");
        if (audioPlayer) {
          audioPlayer
            .play()
            .then(() => {
              window.isPlaying = true;
              if (audioIcon) {
                audioIcon.classList.remove("ph-speaker-slash");
                audioIcon.classList.add(
                  "animate-spin-slow",
                  "ph-music-notes",
                );
              }
            })
            .catch(() => {
              // autoplay diblokir browser, user bisa aktifkan manual lewat tombol audio
              window.isPlaying = false;
              if (audioIcon) {
                audioIcon.classList.remove(
                  "animate-spin-slow",
                  "ph-music-notes",
                );
                audioIcon.classList.add("ph-speaker-slash");
              }
            });
        }

        if (
          typeof player !== "undefined" &&
          player &&
          typeof player.playVideo === "function"
        ) {
          player.playVideo();
        }

        const hideCover = () => {
          cover.style.display = "none";
          cover.removeEventListener("transitionend", onTransitionEnd);
          // unlock scrolling now that cover is gone
          body.classList.remove("locked");
          document.documentElement.style.overflowY = "auto";
          body.style.overflowY = "auto";
          // reveal main content and audio button
          body.classList.add("invitation-open");
          btnAudio.classList.remove("hidden");
          requestAnimationFrame(() => btnAudio.classList.add("show"));
          // refresh AOS so animations trigger now that content is visible
          if (window.AOS && typeof AOS.refresh === "function") AOS.refresh();
        };

        const onTransitionEnd = (event) => {
          if (event.propertyName === "transform") hideCover();
        };

        // after a short pause allow inner fade, then slide cover
        setTimeout(() => cover.classList.add("cover-exit"), 120);
        cover.addEventListener("transitionend", onTransitionEnd);
        // fallback in case transitionend doesn't fire
        setTimeout(hideCover, 1100);
      }

// ===== Konstanta & init halaman =====
      const GAS_URL = "https://script.google.com/macros/s/AKfycbwmeKz0v9qIH2MVbBEQTUgVTHf35UwPdEDJkw-VtTzNwGIS6pdjfg0gtA286pCEPdbz-Q/exec";
      const TARGET_DATE = new Date("Oct 11, 2026 08:00:00").getTime();
      const YOUTUBE_VIDEO_ID = "ugk5pd9xgSw";

      document.addEventListener("DOMContentLoaded", () => {
        const urlParams = new URLSearchParams(window.location.search);
        const guestName = urlParams.get("to");
        document.getElementById("guest-name-display").innerText = guestName
          ? guestName
          : "Tamu Undangan";

        createLeaves("leaves-container");
        createLeaves("cover-leaves-container", window.innerWidth > 768 ? 16 : 9);
        setup3DMomentCarousel();
        if (window.AOS && typeof AOS.init === "function") {
          AOS.init({
            once: false,
            mirror: true,
            duration: 700,
            offset: 80,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          });
        }
        loadMessages();
      });

      function copyText(elementId) {
        const el = document.getElementById(elementId);
        if (!el) {
          Swal.fire({
            icon: "error",
            title: "Kesalahan",
            text: "Teks tidak ditemukan.",
          });
          return;
        }
        const text = (el.innerText || el.textContent || "").trim();
        if (!text) {
          Swal.fire({
            icon: "warning",
            title: "Kosong",
            text: "Tidak ada teks untuk disalin.",
          });
          return;
        }

        const fallbackCopy = (txt) => {
          const ta = document.createElement("textarea");
          ta.value = txt;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          try {
            document.execCommand("copy");
            Swal.fire({
              icon: "success",
              title: "Berhasil!",
              text: "Tersalin: " + txt,
              timer: 2000,
              showConfirmButton: false,
            });
          } catch (e) {
            Swal.fire({
              icon: "info",
              title: "Salin Manual",
              text: "Silakan salin manual: " + txt,
              confirmButtonText: "Oke",
            });
          }
          document.body.removeChild(ta);
        };

        if (
          navigator.clipboard &&
          typeof navigator.clipboard.writeText === "function"
        ) {
          navigator.clipboard
            .writeText(text)
            .then(() => {
              Swal.fire({
                icon: "success",
                title: "Berhasil!",
                text: "Tersalin: " + text,
                timer: 2000,
                showConfirmButton: false,
              });
            })
            .catch(() => fallbackCopy(text));
        } else {
          fallbackCopy(text);
        }
      }


// ===== Countdown, YouTube player, audio, leaves, RSVP & buku tamu =====
      setInterval(() => {
        const now = new Date().getTime();
        const distance = TARGET_DATE - now;

        if (distance < 0) return;

        document.getElementById("days").innerText = String(
          Math.floor(distance / (1000 * 60 * 60 * 24)),
        ).padStart(2, "0");
        document.getElementById("hours").innerText = String(
          Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        ).padStart(2, "0");
        document.getElementById("minutes").innerText = String(
          Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        ).padStart(2, "0");
        document.getElementById("seconds").innerText = String(
          Math.floor((distance % (1000 * 60)) / 1000),
        ).padStart(2, "0");
      }, 1000);

      let player;
      window.isPlaying = false;

      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      function onYouTubeIframeAPIReady() {
        player = new YT.Player("youtube-player", {
          height: "10",
          width: "10",
          videoId: YOUTUBE_VIDEO_ID,
          playerVars: {
            autoplay: 1,
            controls: 0,
            loop: 1,
            playlist: YOUTUBE_VIDEO_ID,
          },
          events: {
            onReady: function (event) {
              try {
                // mute so autoplay is allowed in most browsers
                event.target.mute();
                event.target.playVideo();
                window.isPlaying = true;
              } catch (e) {
                // ignore
              }
            },
          },
        });
      }

      window.toggleAudio = function () {
        const icon = document.getElementById("audio-icon");
        const audioPlayer = document.getElementById("audio-player");
        if (!audioPlayer) return;

        if (window.isPlaying) {
          audioPlayer.pause();
          icon.classList.remove("animate-spin-slow", "ph-music-notes");
          icon.classList.add("ph-speaker-slash");
          window.isPlaying = false;
        } else {
          audioPlayer.play();
          icon.classList.remove("ph-speaker-slash");
          icon.classList.add("animate-spin-slow", "ph-music-notes");
          window.isPlaying = true;
        }
      };

      function createLeaves(containerId = "leaves-container", countOverride) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const leafCount =
          countOverride ?? (window.innerWidth > 768 ? 22 : 12);

        for (let i = 0; i < leafCount; i++) {
          const leaf = document.createElement("div");
          leaf.classList.add("leaf");
          leaf.style.left = Math.random() * 100 + "vw";
          leaf.style.animationDuration = Math.random() * 6 + 10 + "s";
          leaf.style.animationDelay = Math.random() * 10 + "s";

          const size = Math.random() * 14 + 10;
          leaf.style.width = size + "px";
          leaf.style.height = size + "px";
          container.appendChild(leaf);
        }
      }

      // Client-side pagination for Ucapan Masuk
      let messagesData = [];
      let currentPage = 1;
      const PAGE_SIZE = 10; // messages per page

      async function loadMessages() {
        const messagesList = document.getElementById("messages-list");
        const paginationWrap = document.getElementById("messages-pagination");
        if (!GAS_URL || GAS_URL.includes("MASUKKAN_URL")) {
          messagesList.innerHTML =
            '<p class="text-center text-gray-400 text-sm italic py-4">Database ucapan belum terhubung.</p>';
          if (paginationWrap) paginationWrap.innerHTML = "";
          return;
        }

        try {
          const response = await fetch(GAS_URL);
          const result = await response.json();
          if (result.status === "success" && Array.isArray(result.data)) {
            // store newest-first
            messagesData = result.data.slice().reverse();
            renderMessagesPage(1);
          } else {
            messagesData = [];
            messagesList.innerHTML =
              '<p class="text-center text-gray-400 text-sm py-4">Belum ada ucapan.</p>';
            if (paginationWrap) paginationWrap.innerHTML = "";
          }
        } catch (error) {
          messagesList.innerHTML =
            '<p class="text-center text-red-400 text-sm py-4">Gagal memuat daftar ucapan.</p>';
          if (paginationWrap) paginationWrap.innerHTML = "";
          console.error(error);
        }
      }

      function renderMessagesPage(page) {
        const messagesList = document.getElementById("messages-list");
        const paginationWrap = document.getElementById("messages-pagination");
        const total = messagesData.length;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        currentPage = Math.min(Math.max(1, page), totalPages);

        const start = (currentPage - 1) * PAGE_SIZE;
        const slice = messagesData.slice(start, start + PAGE_SIZE);

        if (!slice.length) {
          messagesList.innerHTML =
            '<p class="text-center text-gray-400 text-sm py-4">Belum ada ucapan.</p>';
        } else {
          messagesList.innerHTML = "";
          slice.forEach((msg) => {
            const dateObj = msg.timestamp ? new Date(msg.timestamp) : new Date();
            const dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
            const badgeColor =
              (msg.kehadiran || "").toLowerCase() === "hadir"
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : "bg-red-50 text-red-600 border-red-100";
            const jumlahTamuLabel = msg.jumlah_tamu || msg.jumlahTamu || "-";

            const html = `
              <div class="bg-blue-50/40 p-4 rounded-2xl border border-blue-100/50 shadow-sm">
                <div class="flex justify-between items-center mb-2">
                  <span class="font-serif font-bold text-navy text-[15px]">${msg.nama || "-"}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] px-2.5 py-1 rounded-full font-bold border ${badgeColor}">${msg.kehadiran || "-"}</span>
                    <span class="text-[10px] px-2.5 py-1 rounded-full font-bold border bg-blue-50 text-blue-700 border-blue-200">${jumlahTamuLabel}</span>
                  </div>
                </div>
                <p class="text-600 text-sm mb-3 leading-relaxed font-light text-gray-600">${msg.ucapan || ""}</p>
                <div class="flex items-center justify-start">
                  <span class="text-[10px] text-gray-400 flex items-center gap-1"><i class="ph-fill ph-clock"></i> ${dateStr}</span>
                </div>
              </div>
            `;

            messagesList.insertAdjacentHTML("beforeend", html);
          });
        }

        // update pagination controls (Prev / page numbers / Next)
        if (paginationWrap) {
          const prevDisabled = currentPage <= 1;
          const nextDisabled = currentPage >= totalPages;

          const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
            .map(
              (p) =>
                `<button class="msg-page px-2 py-1 rounded ${
                  p === currentPage ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"
                }" data-page="${p}">${p}</button>`,
            )
            .join(" ");

          paginationWrap.innerHTML = `
            <div class="flex items-center gap-2">
              <button id="msg-prev" class="px-2 py-1 rounded bg-gray-100 ${prevDisabled ? "opacity-50" : ""}">Prev</button>
              <div class="flex items-center gap-1">${pages}</div>
              <button id="msg-next" class="px-2 py-1 rounded bg-gray-100 ${nextDisabled ? "opacity-50" : ""}">Next</button>
            </div>
          `;

          const prevBtn = document.getElementById("msg-prev");
          const nextBtn = document.getElementById("msg-next");
          if (prevBtn) prevBtn.onclick = () => renderMessagesPage(currentPage - 1);
          if (nextBtn) nextBtn.onclick = () => renderMessagesPage(currentPage + 1);

          // wire page number buttons
          document.querySelectorAll(".msg-page").forEach((btn) => {
            btn.onclick = () => renderMessagesPage(Number(btn.dataset.page));
          });

          // (love feature removed)
        }
      }

      // Disable "Jumlah Tamu" jika kehadiran selain "Hadir"
      const kehadiranSelect = document.getElementById("kehadiran");
      const jumlahTamuSelect = document.getElementById("jumlah-tamu");

      function toggleJumlahTamu() {
        if (kehadiranSelect.value === "Hadir" || kehadiranSelect.value === "Belum Pasti") {
          jumlahTamuSelect.disabled = false;
          jumlahTamuSelect.classList.remove(
            "opacity-50",
            "cursor-not-allowed",
          );
        } else {
          jumlahTamuSelect.disabled = true;
          jumlahTamuSelect.value = "0";
          jumlahTamuSelect.classList.add("opacity-50", "cursor-not-allowed");
        }
      }

      if (kehadiranSelect && jumlahTamuSelect) {
        kehadiranSelect.addEventListener("change", toggleJumlahTamu);
        toggleJumlahTamu(); // set state awal saat halaman dimuat
      }

      document
        .getElementById("rsvp-form")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const btnSubmit = document.getElementById("btn-submit");
          const formStatus = document.getElementById("form-status");

          if (!GAS_URL || GAS_URL.includes("MASUKKAN_URL")) {
            alert("URL Google Apps Script belum di-setting!");
            return;
          }

          btnSubmit.innerHTML =
            '<i class="ph-bold ph-spinner animate-spin text-lg"></i> Mengirim...';
          btnSubmit.disabled = true;
          formStatus.innerText = "";

          const payload = {
            nama: document.getElementById("nama").value,
            kehadiran: document.getElementById("kehadiran").value,
            jumlah_tamu: document.getElementById("jumlah-tamu").value,
            ucapan: document.getElementById("ucapan").value,
          };

          try {
            const response = await fetch(GAS_URL, {
              method: "POST",
              body: JSON.stringify(payload),
              headers: { "Content-Type": "text/plain;charset=utf-8" },
            });
            const result = await response.json();

            if (result.status === "success") {
              formStatus.style.color = "#2563eb";
              formStatus.innerText =
                result.message || "Terima kasih! Ucapan berhasil dikirim.";
              document.getElementById("rsvp-form").reset();
              loadMessages();
            } else throw new Error(result.message);
          } catch (error) {
            formStatus.style.color = "red";
            formStatus.innerText =
              error?.message || "Gagal mengirim pesan, coba lagi nanti.";
          } finally {
            btnSubmit.innerHTML =
              '<i class="ph-bold ph-paper-plane-tilt text-lg"></i> Kirim Ucapan';
            btnSubmit.disabled = false;
            setTimeout(() => {
              formStatus.innerText = "";
            }, 5000);
          }
        });

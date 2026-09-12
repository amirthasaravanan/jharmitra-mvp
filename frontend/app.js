const app = document.getElementById("app");

const savedToken =
  localStorage.getItem("js_token") ||
  sessionStorage.getItem("js_token");

const savedUser =
  localStorage.getItem("js_user") ||
  sessionStorage.getItem("js_user");

const state = {
  token: savedToken,
  user: JSON.parse(savedUser || "null")
};


// ============================================================
// API HELPER
// ============================================================

async function api(path, options = {}) {

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const res = await fetch(path, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.detail || "Something went wrong"
    );
  }

  return data;
}


// ============================================================
// UTILITIES
// ============================================================

function esc(s) {

  return String(s ?? "").replace(
    /[&<>"']/g,
    m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m])
  );
}


function toast(msg) {

  const x = document.createElement("div");

  x.className = "toast";

  x.textContent = msg;

  document.body.appendChild(x);

  setTimeout(() => x.remove(), 2600);
}


function logout() {

  localStorage.removeItem("js_token");
  localStorage.removeItem("js_user");

  sessionStorage.removeItem("js_token");
  sessionStorage.removeItem("js_user");

  state.token = null;
  state.user = null;

  renderLogin();
}


// ============================================================
// LOGIN PAGE
// ============================================================

function renderLogin() {

  app.innerHTML = `
  <div class="jhar-login-page">

    <!-- LEFT: STATIC JHARKHAND HERO IMAGE -->

    <section class="jhar-hero">

      <img
        src="/static/assets/jharmitra.png"
        alt="JharMitra — Jharkhand societal challenge platform"
        class="jhar-hero-image"
      >

    </section>
      


      <!-- =====================================================
           RIGHT: LOGIN
           ===================================================== -->

      <section class="jhar-login-panel">

        


        <div class="jhar-login-card">

          <!-- Login heading -->
          <div class="jhar-login-heading">

            

            <h2>
              Welcome to
              <br>
              Jhar<span>Mitra</span>
            </h2>

            <div class="heading-line"></div>

            <p>
              Choose your role and use a demo account
              to explore the platform.
            </p>

          </div>


          <!-- Role selection -->
          <div class="jhar-role-switch">

            <button
              type="button"
              class="jhar-role active"
              data-role="Citizen"
            >
              <span class="role-icon">♟</span>
              <span>Citizen</span>
            </button>

            <button
              type="button"
              class="jhar-role"
              data-role="University"
            >
              <span class="role-icon">◆</span>
              <span>University</span>
            </button>

            <button
              type="button"
              class="jhar-role"
              data-role="Industry"
            >
              <span class="role-icon">▥</span>
              <span>Industry</span>
            </button>

            <button
              type="button"
              class="jhar-role"
              data-role="Government"
            >
              <span class="role-icon">♜</span>
              <span>Government</span>
            </button>

          </div>


          <!-- Login form -->
          <form id="loginForm" class="jhar-login-form">

            <!-- Email -->
            <div class="jhar-field">

              <label for="email">
                Email address
              </label>

              <div class="jhar-input-wrap">

                <span class="input-icon">
                  ✉
                </span>

                <input
                  id="email"
                  type="email"
                  value="citizen@jharmitra.demo"
                  placeholder="Enter your email"
                  autocomplete="email"
                  required
                >

              </div>

            </div>


            <!-- Password -->
            <div class="jhar-field">

              <label for="password">
                Password
              </label>

              <div class="jhar-input-wrap">

                <span class="input-icon">
                  🔒
                </span>

                <input
                  id="password"
                  type="password"
                  value="demo123"
                  placeholder="Enter your password"
                  autocomplete="current-password"
                  required
                >

                <button
                  type="button"
                  class="password-toggle"
                  id="togglePassword"
                  aria-label="Show password"
                >
                  ◉
                </button>

              </div>

            </div>


            <!-- Remember / forgot -->
            <div class="jhar-login-options">

              <label class="remember">

                <input
                  type="checkbox"
                  id="rememberMe"
                  checked
                >

                <span class="custom-check"></span>

                <span>Remember me</span>

              </label>


              <button
                type="button"
                class="forgot-password"
                id="forgotPassword"
              >
                Forgot password?
              </button>

            </div>


            <!-- Sign in -->
            <button
              type="submit"
              class="jhar-signin"
              id="signInButton"
            >

              <span>
                Sign in to JharMitra
              </span>

              <span class="signin-arrow">
                →
              </span>

            </button>

          </form>


          <!-- Demo accounts -->
          <div class="jhar-demo-box">

            <div class="demo-heading">

              <span class="demo-key">
                ⚿
              </span>

              <strong>
                Demo Accounts
              </strong>

              <span>
                (Password: demo123)
              </span>

            </div>


            <div class="demo-accounts-grid">

              <button
                type="button"
                data-demo-role="Citizen"
              >
                <span>♟</span>
                citizen@jharmitra.demo
              </button>

              <button
                type="button"
                data-demo-role="University"
              >
                <span>◆</span>
                university@jharmitra.demo
              </button>

              <button
                type="button"
                data-demo-role="Industry"
              >
                <span>▥</span>
                industry@jharmitra.demo
              </button>

              <button
                type="button"
                data-demo-role="Government"
              >
                <span>♜</span>
                government@jharmitra.demo
              </button>

            </div>

          </div>


          <!-- Login bottom message -->
          <div class="jhar-login-bottom">

            <div class="bottom-divider"></div>

            <div class="bottom-message">

              <span class="bottom-leaf">
                ❧
              </span>

              <div>
                <span>
                  Together for a stronger, brighter Jharkhand
                </span>

                
              </div>

            </div>

          </div>

        </div>


        <!-- Footer -->
        

      </section>

    </div>
  `;


  /* ============================================================
     ROLE SELECTION
     ============================================================ */

  const roleEmails = {
  Citizen: "citizen@jharmitra.demo",
  University: "university@jharmitra.demo",
  Industry: "industry@jharmitra.demo",
  Government: "government@jharmitra.demo"
};


  document
    .querySelectorAll(".jhar-role")
    .forEach(button => {

      button.addEventListener("click", () => {

        const role = button.dataset.role;

        document
          .querySelectorAll(".jhar-role")
          .forEach(item => {
            item.classList.remove("active");
          });

        button.classList.add("active");

        document.getElementById("email").value =
          roleEmails[role];

      });

    });


  /* ============================================================
     DEMO ACCOUNT BUTTONS
     ============================================================ */

  document
    .querySelectorAll("[data-demo-role]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const role = button.dataset.demoRole;

        document
          .querySelectorAll(".jhar-role")
          .forEach(item => {

            item.classList.toggle(
              "active",
              item.dataset.role === role
            );

          });

        document.getElementById("email").value =
          roleEmails[role];

        document.getElementById("password").value =
          "demo123";

      });

    });


  /* ============================================================
     SHOW / HIDE PASSWORD
     ============================================================ */

  const passwordInput =
    document.getElementById("password");

  const togglePassword =
    document.getElementById("togglePassword");

  togglePassword.addEventListener("click", () => {

    const visible =
      passwordInput.type === "text";

    passwordInput.type =
      visible ? "password" : "text";

    togglePassword.textContent =
      visible ? "◉" : "◎";

  });


  /* ============================================================
     FORGOT PASSWORD
     ============================================================ */

  document
    .getElementById("forgotPassword")
    .addEventListener("click", () => {

      toast(
        "Demo accounts use password: demo123"
      );

    });


  /* ============================================================
     LOGIN
     ============================================================ */

  document
    .getElementById("loginForm")
    .addEventListener("submit", async event => {

      event.preventDefault();

      const email =
        document.getElementById("email").value.trim();

      const password =
        document.getElementById("password").value;

      const button =
        document.getElementById("signInButton");

      const remember =
        document.getElementById("rememberMe").checked;


      if (!email || !password) {

        toast("Please enter your email and password.");

        return;

      }


      button.disabled = true;

      button.innerHTML = `
        <span>Signing in...</span>
        <span class="signin-spinner"></span>
      `;


      try {

        console.log(
          "JharMitra: sending login request"
        );


        const d = await api(
          "/api/login",
          {
            method: "POST",
            body: JSON.stringify({
              email,
              password
            })
          }
        );


        console.log(
          "JharMitra: login response",
          d
        );


        state.token = d.token;
        state.user = d.user;


        if (remember) {

          localStorage.setItem(
            "js_token",
            d.token
          );

          localStorage.setItem(
            "js_user",
            JSON.stringify(d.user)
          );

        } else {

          sessionStorage.setItem(
            "js_token",
            d.token
          );

          sessionStorage.setItem(
            "js_user",
            JSON.stringify(d.user)
          );

        }


        console.log(
          "JharMitra: authenticated user",
          d.user
        );


        await renderDashboard();


      } catch (error) {

        console.error(
          "JharMitra login error:",
          error
        );

        toast(
          error.message ||
          "Unable to sign in"
        );


        button.disabled = false;

        button.innerHTML = `
          <span>Sign in to JharMitra</span>
          <span class="signin-arrow">→</span>
        `;

      }

    });

}

// ============================================================
// HEADER
// ============================================================

function header() {

  return `

    <header class="topbar">

      <div class="brand">

        <div class="brandmark">
          J
        </div>

        <div>

          <div class="brandname">
            JharMitra
          </div>

          <div class="brandtag">
            Collaborative Civic Innovation Platform
          </div>

        </div>

      </div>


      <div class="usernav">

        <span
          style="
            font-size:12px;
            color:#667085
          "
        >
          ${esc(
            state.user.organization ||
            "Citizen"
          )}
        </span>


        <div class="avatar">

          ${esc(
            (state.user.name || "U")[0]
          )}

        </div>


        <button
          class="logout"
          onclick="logout()"
        >
          Logout
        </button>

      </div>

    </header>

  `;

}


// ============================================================
// DASHBOARD ROUTER
// ============================================================

async function renderDashboard() {

  if (!state.token || !state.user) {
    renderLogin();
    return;
  }

  console.log(
    "Rendering dashboard for:",
    state.user.role
  );

  let dashboardHTML;

  try {

    if (state.user.role === "Government") {

      dashboardHTML = await renderGovernment();

    } else {

      const problems =
        await api("/api/problems");

      if (state.user.role === "Citizen") {

        dashboardHTML =
          renderCitizen(problems);

      } else {

        dashboardHTML =
          renderPartner(
            problems,
            state.user.role
          );

      }

    }

    // --------------------------------------------------------
    // IMPORTANT FIX
    // Actually put the generated dashboard HTML into the page.
    // --------------------------------------------------------

    app.innerHTML = dashboardHTML;

    console.log(
      "JharMitra: dashboard HTML rendered"
    );

  } catch (error) {

    console.error(
      "JharMitra dashboard error:",
      error
    );

    toast(
      error.message ||
      "Unable to load dashboard"
    );

    // Keep the user on login if dashboard loading fails
    localStorage.removeItem("js_token");
    localStorage.removeItem("js_user");

    state.token = null;
    state.user = null;

    renderLogin();
  }
}


// ============================================================
// PAGE SHELL
// ============================================================

function pageShell(
  title,
  sub,
  content,
  action = ""
) {

  return `

    ${header()}

    <main class="shell">

      <div class="hero">

        <div>

          <div class="eyebrow">

            ${esc(
              state.user.role
            )}
            PORTAL

          </div>


          <h1>
            ${title}
          </h1>


          <p>
            ${sub}
          </p>

        </div>


        <div class="hero-action">

          ${action}

        </div>

       </div>

      ${demoMvpBanner(state.user.role)}

      ${content}

    </main>

  `;

}


// ============================================================
// PROBLEM CARD
// ============================================================

function problemCard(
  p,
  actions = true
) {

  return `

    <div class="problem-item">

      <div>

        <div class="problem-title">

          ${esc(p.title)}

        </div>


        <div class="problem-desc">

          ${esc(p.description).slice(
            0,
            145
          )}

          ${
            p.description.length > 145
              ? "…"
              : ""
          }

        </div>


        <div class="badges">

          <span class="badge badge-blue">

            ${esc(
              p.domain ||
              "Analysing"
            )}

          </span>


          <span
            class="badge ${
              p.priority >= 75
                ? "badge-red"
                : "badge-amber"
            }"
          >

            ${
              p.priority_label ||
              "Pending"
            }

            •

            ${
              p.priority ||
              "—"
            }

          </span>


          <span class="badge">

            ${esc(
              p.location
            )}

          </span>


          <span class="badge badge-green">

            ${esc(
              p.status
            )}

          </span>

        </div>

      </div>


      ${
        actions
          ? `
            <button
              class="btn btn-light"
              onclick="openProblem(${p.id})"
            >
              View intelligence
            </button>
          `
          : ""
      }

    </div>

  `;

}


// ============================================================
// CITIZEN DASHBOARD
// ============================================================
function demoMvpBanner(role) {

  const messages = {

    Citizen:
      "This demonstration version showcases the citizen problem-reporting workflow. Advanced multilingual input, intelligent analysis, collaboration and impact-tracking features are currently under development.",

    University:
      "This demonstration version showcases the university-side challenge discovery and partner workflow. Advanced capability matching, collaboration management and solution tracking are currently under development.",

    Industry:
      "This demonstration version showcases the industry-side challenge discovery and engagement workflow. Advanced partner matching, collaboration, mentorship and implementation tracking are currently under development.",

    Government:
      "This demonstration version showcases the government-side societal challenge intelligence and monitoring workflow. Advanced analytics, department integration, impact measurement and governance features are currently under development."

  };

  return `
    <div class="demo-mvp-banner">

      <div class="demo-mvp-title">
        <span class="demo-mvp-dot"></span>
        DEMO MVP — CORE FEATURE DEVELOPMENT IN PROGRESS
      </div>

      <div class="demo-mvp-message">
        ${messages[role] || messages.Citizen}
      </div>

    </div>
  `;
}
function renderCitizen(
  problems
) {


  const total =
    problems.length;


  const high =
    problems.filter(
      p => p.priority >= 75
    ).length;


  const active =
    problems.filter(
      p => p.status !== "Resolved"
    ).length;


  return pageShell(

    "Citizen dashboard",

    "Submit a real societal challenge and let JharMitra analyse and route it intelligently.",


    `

      <div class="grid kpis">

        <div class="card">

          <div class="kpi-label">
            My submissions
          </div>

          <div class="kpi-value">
            ${total}
          </div>

          <div class="kpi-meta">
            Across all domains
          </div>

        </div>


        <div class="card">

          <div class="kpi-label">
            High priority
          </div>

          <div class="kpi-value">
            ${high}
          </div>

          <div class="kpi-meta">
            Needs attention
          </div>

        </div>


        <div class="card">

          <div class="kpi-label">
            Active challenges
          </div>

          <div class="kpi-value">
            ${active}
          </div>

          <div class="kpi-meta">
            Being reviewed or solved
          </div>

        </div>


        <div class="card">

          <div class="kpi-label">
            Intelligence
          </div>

          <div class="kpi-value">
            AI
          </div>

          <div class="kpi-meta">
            Categorize • detect • match
          </div>

        </div>

      </div>


      <div class="grid two">

        <section class="card">

          <h3 class="section-title">
            My reported challenges
          </h3>


          <div class="problem-list">

            ${
              problems.length

                ? problems
                    .map(
                      p => problemCard(p)
                    )
                    .join("")

                : `
                  <div class="empty">

                    No problems yet.
                    Submit your first challenge.

                  </div>
                `
            }

          </div>

        </section>


        <section class="card">

          <h3 class="section-title">
            How JharMitra works
          </h3>


          <div class="timeline">

            <div class="step done">
              1<br>Submit
            </div>

            <div class="step done">
              2<br>Categorize
            </div>

            <div class="step done">
              3<br>Deduplicate
            </div>

            <div class="step">
              4<br>Match
            </div>

          </div>


          <div class="screen-row">

            <div class="screen">

              <b>Problem</b>

              <div class="fakebar"></div>

              <div class="fakecard"></div>

            </div>


            <div class="screen">

              <b>AI analysis</b>

              <div class="fakebar"></div>

              <div class="fakecard"></div>

            </div>


            <div class="screen">

              <b>Partner match</b>

              <div class="fakebar"></div>

              <div class="fakecard"></div>

            </div>

          </div>

        </section>

      </div>

    `,


    `
      <button
        class="btn btn-primary"
        onclick="openSubmit()"
      >
        + Submit a problem
      </button>
    `

  );

}


// ============================================================
// UNIVERSITY / INDUSTRY DASHBOARD
// ============================================================

function renderPartner(
  problems,
  role
) {

  const relevant =
    problems
      .filter(
        p => p.status !== "Resolved"
      )
      .sort(
        (a, b) =>
          (b.priority || 0) -
          (a.priority || 0)
      );


  return pageShell(

    `${role} dashboard`,

    role === "University"

      ? "Discover high-value societal challenges aligned with your research capabilities."

      : "Find societal challenges where your industry expertise can create measurable impact.",


    `

      <div class="grid kpis">

        <div class="card">

          <div class="kpi-label">
            Open challenges
          </div>

          <div class="kpi-value">
            ${relevant.length}
          </div>

          <div class="kpi-meta">
            Available for collaboration
          </div>

        </div>


        <div class="card">

          <div class="kpi-label">
            High priority
          </div>

          <div class="kpi-value">

            ${
              relevant.filter(
                p => p.priority >= 75
              ).length
            }

          </div>

          <div class="kpi-meta">
            Recommended first
          </div>

        </div>


        <div class="card">

          <div class="kpi-label">
            Matching
          </div>

          <div class="kpi-value">
            AI
          </div>

          <div class="kpi-meta">
            Capability-based ranking
          </div>

        </div>


        <div class="card">

          <div class="kpi-label">
            Workflow
          </div>

          <div class="kpi-value">
            24/7
          </div>

          <div class="kpi-meta">
            Track progress & milestones
          </div>

        </div>

      </div>


      <div class="grid two">

        <section class="card">

          <h3 class="section-title">
            Recommended challenges
          </h3>

          <p class="section-sub">

            Ranked by domain, expertise,
            location and availability.

          </p>


          <div class="problem-list">

            ${
              relevant.length

                ? relevant
                    .map(
                      p => problemCard(p)
                    )
                    .join("")

                : `
                  <div class="empty">
                    No open challenges available yet.
                  </div>
                `
            }

          </div>

        </section>


        <section class="card">

          <h3 class="section-title">
            Collaboration workflow
          </h3>


          <div class="timeline">

            <div class="step done">
              Challenge
            </div>

            <div class="step done">
              Match
            </div>

            <div class="step">
              Accept
            </div>

            <div class="step">
              Implement
            </div>

          </div>


          <h3
            class="section-title"
            style="margin-top:25px"
          >
            Your capability profile
          </h3>


          <div class="badges">

            <span class="badge badge-blue">

              ${esc(
                state.user.organization
              )}

            </span>


            <span class="badge badge-green">

              ${role} Partner

            </span>


            <span class="badge">

              Domain matched

            </span>

          </div>


          <p
            style="
              font-size:13px;
              color:#667085;
              line-height:1.6
            "
          >

            JharMitra ranks challenges against
            partner capabilities so institutions
            can focus on problems they are
            equipped to solve.

          </p>

        </section>

      </div>

    `

  );

}


// ============================================================
// GOVERNMENT DASHBOARD
// ============================================================

async function renderGovernment() {

  console.log(
    "JharMitra: requesting government summary"
  );


  const d =
    await api(
      "/api/government/summary"
    );


  console.log(
    "Government summary:",
    d
  );


  const max =
    Math.max(
      ...d.domains.map(
        x => x.count
      ),
      1
    );


  return pageShell(

    "Government intelligence dashboard",

    "A state-level view of emerging societal challenges, priority areas and solution activity.",


    `

      <div class="grid kpis">


        <div class="card">

          <div class="kpi-label">
            Total challenges
          </div>

          <div class="kpi-value">
            ${d.total}
          </div>

          <div class="kpi-meta">
            Citizen-reported
          </div>

        </div>


        <div class="card">

          <div class="kpi-label">
            High priority
          </div>

          <div class="kpi-value">
            ${d.high_priority}
          </div>

          <div class="kpi-meta">
            Priority ≥ 75
          </div>

        </div>


        <div class="card">

          <div class="kpi-label">
            Active
          </div>

          <div class="kpi-value">
            ${d.active}
          </div>

          <div class="kpi-meta">
            Not yet resolved
          </div>

        </div>


        <div class="card">

          <div class="kpi-label">
            Resolved
          </div>

          <div class="kpi-value">
            ${d.resolved}
          </div>

          <div class="kpi-meta">
            Closed challenges
          </div>

        </div>

      </div>


      <div class="grid layout3">


        <section class="card">

          <h3 class="section-title">
            Domain intelligence
          </h3>

          <p class="section-sub">
            Where challenges are concentrated.
          </p>


          <div class="bars">

            ${d.domains.map(
              x => `

                <div class="bar-row">

                  <span>
                    ${esc(x.domain)}
                  </span>


                  <div class="bar">

                    <i
                      style="
                        width:${Math.round(
                          x.count /
                          max *
                          100
                        )}%
                      "
                    ></i>

                  </div>


                  <b>
                    ${x.count}
                  </b>

                </div>

              `
            ).join("")}

          </div>

        </section>


        <section class="card">

          <h3 class="section-title">
            Priority challenges
          </h3>


          <div class="problem-list">

            ${
              d.top.length

                ? d.top.map(
                    p => `

                      <div class="problem-item">

                        <div>

                          <div class="problem-title">

                            ${esc(p.title)}

                          </div>


                          <div class="badges">

                            <span class="badge badge-red">

                              ${esc(
                                p.priority_label
                              )}

                              •

                              ${p.priority}

                            </span>


                            <span class="badge">

                              ${esc(
                                p.domain
                              )}

                            </span>

                          </div>

                        </div>

                      </div>

                    `
                  ).join("")

                : `
                  <div class="empty">
                    No challenges submitted yet.
                  </div>
                `
            }

          </div>

        </section>


        <section class="card">

          <h3 class="section-title">
            Solution activity
          </h3>


          <div class="bars">

            ${d.statuses.map(
              x => `

                <div class="bar-row">

                  <span>
                    ${esc(x.status)}
                  </span>


                  <div class="bar">

                    <i
                      style="
                        width:${Math.min(
                          100,
                          x.count /
                          Math.max(
                            d.total,
                            1
                          ) *
                          100
                        )}%
                      "
                    ></i>

                  </div>


                  <b>
                    ${x.count}
                  </b>

                </div>

              `
            ).join("")}

          </div>


          <div
            style="
              margin-top:24px;
              padding:14px;
              background:#f5f7ff;
              border-radius:12px;
              font-size:12px;
              color:#475467
            "
          >

            Use this view to identify
            region/domain trends, monitor
            partner activity and prioritise
            interventions.

          </div>

        </section>


      </div>

    `

  );

}


// ============================================================
// SUBMIT PROBLEM MODAL
// ============================================================

function openSubmit() {

  const modal =
    document.createElement("div");


  modal.className =
    "modal-backdrop";


  modal.innerHTML = `

    <div class="modal">


      <div class="modal-head">


        <div>

          <div class="eyebrow">
            CITIZEN REPORT
          </div>


          <h2
            style="
              font-family:Space Grotesk;
              margin:5px 0
            "
          >
            Submit a societal challenge
          </h2>


          <p
            style="
              color:#667085;
              margin-top:0
            "
          >

            The platform will identify the
            domain, check duplicates and
            recommend solution partners.

          </p>

        </div>


        <button class="close">
          ×
        </button>


      </div>


      <form id="problemForm">


        <div class="field">

          <label>
            Problem title
          </label>


          <input
            id="ptitle"
            placeholder="e.g. Contaminated groundwater near mining area"
            required
          >

        </div>


        <div class="field">

          <label>
            Describe the problem
          </label>


          <textarea
            id="pdesc"
            placeholder="Describe who is affected, what is happening and why it matters..."
            required
          ></textarea>

        </div>


        <div class="field">

          <label>
            Location
          </label>


          <input
            id="plocation"
            value="Dhanbad, Jharkhand"
            required
          >

        </div>


        <button
          type="submit"
          class="btn btn-primary full"
        >
          Analyse & submit challenge
        </button>


      </form>


    </div>

  `;


  document.body.appendChild(
    modal
  );


  modal.querySelector(
    ".close"
  ).onclick = () =>
    modal.remove();


  // ----------------------------------------------------------
  // PROBLEM SUBMISSION
  // ----------------------------------------------------------

  modal
    .querySelector("#problemForm")
    .onsubmit = async function(e) {

      e.preventDefault();


      const titleInput =
        document.getElementById(
          "ptitle"
        );


      const descInput =
        document.getElementById(
          "pdesc"
        );


      const locationInput =
        document.getElementById(
          "plocation"
        );


      const submitButton =
        modal.querySelector(
          "#problemForm button[type='submit']"
        );


      try {

        submitButton.disabled =
          true;


        submitButton.textContent =
          "Analysing...";


        const data =
          await api(
            "/api/problems",
            {
              method: "POST",

              body: JSON.stringify({

                title:
                  titleInput.value.trim(),

                description:
                  descInput.value.trim(),

                location:
                  locationInput.value.trim()

              })

            }
          );


        modal.remove();


        showIntelligence({

          problem: {

            id: data.id,

            title:
              titleInput.value.trim(),

            description:
              descInput.value.trim(),

            location:
              locationInput.value.trim(),

            priority:
              data.priority,

            priority_label:
              data.priority_label

          },

          domain:
            data.domain,

          confidence:
            data.confidence,

          duplicates:
            data.duplicates || [],

          matches:
            data.matches || []

        });


        await renderDashboard();


        toast(
          "Challenge submitted and analysed"
        );


      } catch (err) {

        console.error(
          "Problem submission error:",
          err
        );


        toast(
          err.message ||
          "Unable to submit challenge"
        );


        if (submitButton) {

          submitButton.disabled =
            false;

          submitButton.textContent =
            "Analyse & submit challenge";

        }

      }

    };

}


// ============================================================
// OPEN PROBLEM
// ============================================================

async function openProblem(id) {

  try {

    const data =
      await api(
        `/api/problems/${id}/intelligence`
      );


    showIntelligence(data);


  } catch (e) {

    console.error(
      "Problem intelligence error:",
      e
    );


    toast(
      e.message
    );

  }

}


// ============================================================
// PROBLEM INTELLIGENCE MODAL
// ============================================================

function showIntelligence(data) {

  const p =
    data.problem;


  const dup =
    data.duplicates || [];


  const matches =
    data.matches || [];


  const modal =
    document.createElement(
      "div"
    );


  modal.className =
    "modal-backdrop";


  modal.innerHTML = `

    <div class="modal">


      <div class="modal-head">


        <div>

          <div class="eyebrow">

            PROBLEM INTELLIGENCE
            #${p.id}

          </div>


          <h2
            style="
              font-family:Space Grotesk;
              margin:5px 0
            "
          >
            ${esc(p.title)}
          </h2>


          <div class="badges">


            <span class="badge badge-blue">

              ${esc(
                data.domain
              )}

            </span>


            <span class="badge badge-green">

              ${esc(
                p.location
              )}

            </span>


            <span class="badge badge-red">

              ${esc(
                p.priority_label
              )}

              •

              ${p.priority}/100

            </span>


          </div>

        </div>


        <button class="close">
          ×
        </button>


      </div>


      <p
        style="
          line-height:1.6;
          color:#475467
        "
      >

        ${esc(
          p.description
        )}

      </p>


      <div class="analysis">


        <div class="metric">

          <small>
            Domain confidence
          </small>

          <strong>
            ${data.confidence}%
          </strong>


          <div class="progress">

            <span
              style="
                width:${data.confidence}%
              "
            ></span>

          </div>

        </div>


        <div class="metric">

          <small>
            Priority score
          </small>

          <strong>
            ${p.priority}/100
          </strong>


          <div class="progress">

            <span
              style="
                width:${p.priority}%
              "
            ></span>

          </div>

        </div>


        <div class="metric">

          <small>
            Potential duplicates
          </small>


          <strong>

            ${
              dup.length
                ? dup[0].similarity + "%"
                : "None"
            }

          </strong>


          <small>

            ${
              dup.length
                ? "Highest similarity"
                : "No strong match found"
            }

          </small>

        </div>


      </div>


      <div
        class="grid two"
        style="margin-top:18px"
      >


        <section>

          <h3 class="section-title">

            Duplicate detection

          </h3>


          ${
            dup.length

              ? dup.map(
                  item => `

                    <div class="match">

                      <div class="match-top">

                        <b>
                          ${esc(
                            item.problem.title
                          )}
                        </b>


                        <span class="score">

                          ${item.similarity}%

                        </span>

                      </div>


                      <div class="problem-desc">

                        ${esc(
                          item.problem.description
                        )}

                      </div>

                    </div>

                  `
                ).join("")

              : `
                <div class="empty">

                  No strong semantic
                  duplicate detected.

                </div>
              `
          }

        </section>


        <section>

          <h3 class="section-title">

            Recommended partners

          </h3>


          ${
            matches.length

              ? matches.map(
                  item => `

                    <div class="match">


                      <div class="match-top">

                        <b>

                          ${esc(
                            item.partner.name
                          )}

                        </b>


                        <span class="score">

                          ${item.match_score}%

                        </span>

                      </div>


                      <div class="problem-desc">

                        ${esc(
                          item.partner.partner_type
                        )}

                        •

                        ${esc(
                          item.partner.location
                        )}

                        <br>

                        ${esc(
                          item.partner.expertise
                        )}

                      </div>


                      ${
                        [
                          "University",
                          "Industry"
                        ].includes(
                          state.user.role
                        )

                          ? `

                            <button
                              class="btn btn-green"
                              style="margin-top:8px"
                              onclick="acceptChallenge(${p.id})"
                            >
                              Accept challenge
                            </button>

                          `

                          : ""
                      }

                    </div>

                  `
                ).join("")

              : `
                <div class="empty">

                  No suitable partners found.

                </div>
              `
          }

        </section>


      </div>


      ${
        [
          "University",
          "Industry",
          "Government"
        ].includes(
          state.user.role
        )

          ? `

            <div style="margin-top:18px">

              <h3 class="section-title">

                Update collaboration status

              </h3>


              <select
                id="statusSelect"
                class="status-select"
              >

                <option>
                  Under Review
                </option>

                <option>
                  Partner Accepted
                </option>

                <option>
                  In Progress
                </option>

                <option>
                  Pilot / Deployment
                </option>

                <option>
                  Resolved
                </option>

              </select>


              <button
                class="btn btn-primary"
                onclick="updateStatus(${p.id})"
              >
                Update
              </button>

            </div>

          `

          : ""
      }


    </div>

  `;


  document.body.appendChild(
    modal
  );


  modal.querySelector(
    ".close"
  ).onclick = () =>
    modal.remove();

}


// ============================================================
// ACCEPT CHALLENGE
// ============================================================

async function acceptChallenge(
  id
) {

  try {

    await api(
      `/api/collaborations/${id}/accept`,
      {
        method: "POST"
      }
    );


    toast(
      "Challenge accepted"
    );


    document
      .querySelector(
        ".modal-backdrop"
      )
      ?.remove();


    await renderDashboard();


  } catch (e) {

    console.error(
      "Accept challenge error:",
      e
    );


    toast(
      e.message
    );

  }

}


// ============================================================
// UPDATE STATUS
// ============================================================

async function updateStatus(
  id
) {

  try {

    const select =
      document.getElementById(
        "statusSelect"
      );


    const status =
      select.value;


    await api(
      `/api/collaborations/${id}/status`,
      {
        method: "POST",

        body: JSON.stringify({

          status: status,

          notes:
            "Updated from dashboard"

        })

      }
    );


    toast(
      "Status updated"
    );


    document
      .querySelector(
        ".modal-backdrop"
      )
      ?.remove();


    await renderDashboard();


  } catch (e) {

    console.error(
      "Status update error:",
      e
    );


    toast(
      e.message
    );

  }

}


// ============================================================
// APPLICATION STARTUP
// ============================================================

(async function bootApplication() {

  try {

    if (
      state.token &&
      state.user
    ) {

      console.log(
        "JharMitra: existing session found"
      );


      await renderDashboard();


    } else {

      renderLogin();

    }


  } catch (error) {

    console.error(
      "JharMitra startup error:",
      error
    );


    localStorage.removeItem(
      "js_token"
    );

    localStorage.removeItem(
      "js_user"
    );


    state.token = null;

    state.user = null;


    renderLogin();

  }

})();
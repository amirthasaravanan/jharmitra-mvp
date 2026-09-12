from fastapi import (
    FastAPI,
    HTTPException,
    UploadFile,
    File,
    Header,
)
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta, timezone
import sqlite3
import os
import jwt

from passlib.context import CryptContext

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DB_PATH = os.path.join(BASE_DIR, "jansahyog.db")

UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

STATIC_DIR = os.path.join(BASE_DIR, "frontend")

SECRET_KEY = os.getenv(
    "JWT_SECRET",
    "CHANGE_THIS_SECRET_FOR_PRODUCTION"
)

ALGORITHM = "HS256"

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

app = FastAPI(
    title="JanSahyog MVP",
    version="1.0.0",
    description="AI-powered societal problem solving and collaboration platform"
)


# ============================================================
# DATABASE
# ============================================================

def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():

    conn = db()
    c = conn.cursor()

    c.executescript(
        """
        CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            organization TEXT,
            location TEXT
        );

        CREATE TABLE IF NOT EXISTS partners(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            partner_type TEXT NOT NULL,
            domain TEXT NOT NULL,
            expertise TEXT NOT NULL,
            location TEXT,
            availability TEXT DEFAULT 'Available',
            description TEXT
        );

        CREATE TABLE IF NOT EXISTS problems(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            location TEXT,
            domain TEXT,
            priority INTEGER,
            priority_label TEXT,
            status TEXT DEFAULT 'Submitted',
            image_path TEXT,
            created_at TEXT NOT NULL,

            FOREIGN KEY(user_id)
                REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS problem_partners(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            problem_id INTEGER,
            partner_id INTEGER,
            match_score INTEGER,
            status TEXT DEFAULT 'Recommended',

            FOREIGN KEY(problem_id)
                REFERENCES problems(id),

            FOREIGN KEY(partner_id)
                REFERENCES partners(id)
        );

        CREATE TABLE IF NOT EXISTS collaborations(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            problem_id INTEGER,
            partner_id INTEGER,
            status TEXT DEFAULT 'Invited',
            notes TEXT,
            updated_at TEXT NOT NULL,

            FOREIGN KEY(problem_id)
                REFERENCES problems(id),

            FOREIGN KEY(partner_id)
                REFERENCES partners(id)
        );
        """
    )

    conn.commit()


    # ========================================================
    # DEMO USERS
    # ========================================================

    demo_users = [
        (
            "Demo Citizen",
            "citizen@jharmitra.demo",
            "Citizen",
            "Citizen",
            "Dhanbad, Jharkhand",
        ),

        (
            "Dr. Ananya Rao",
            "university@jharmitra.demo",
            "University",
            "Jharkhand Institute of Technology",
            "Ranchi, Jharkhand",
        ),

        (
            "Arjun Mehta",
            "industry@jharmitra.demo",
            "Industry",
            "AquaSense Technologies",
            "Jamshedpur, Jharkhand",
        ),

        (
            "State Admin",
            "government@jharmitra.demo",
            "Government",
            "Government of Jharkhand",
            "Ranchi, Jharkhand",
        ),
    ]

    for (
        name,
        email,
        role,
        organization,
        location
    ) in demo_users:

        existing = c.execute(
            "SELECT 1 FROM users WHERE email=?",
            (email,)
        ).fetchone()

        if not existing:

            password_hash = pwd_context.hash("demo123")

            c.execute(
                """
                INSERT INTO users(
                    name,
                    email,
                    password_hash,
                    role,
                    organization,
                    location
                )
                VALUES(?,?,?,?,?,?)
                """,
                (
                    name,
                    email,
                    password_hash,
                    role,
                    organization,
                    location,
                )
            )


    # ========================================================
    # DEMO PARTNERS
    # ========================================================

    partners = [

        (
            "Environmental Engineering Research Group",
            "University",
            "Water & Environment",
            "water quality, groundwater, environmental monitoring, sensors",
            "Dhanbad",
            "Available",
            "Research group focused on water quality and mining-affected ecosystems."
        ),

        (
            "Rural Health Innovation Lab",
            "University",
            "Healthcare",
            "telemedicine, diagnostics, rural healthcare, medical devices",
            "Ranchi",
            "Available",
            "Applied research group working on last-mile healthcare."
        ),

        (
            "Digital Learning Lab",
            "University",
            "Education",
            "multilingual learning, edtech, accessibility, digital classrooms",
            "Ranchi",
            "Available",
            "Builds inclusive technology for underserved learners."
        ),

        (
            "AgriTech Research Centre",
            "University",
            "Agriculture",
            "precision agriculture, irrigation, soil monitoring, IoT",
            "Hazaribagh",
            "Available",
            "Agricultural technology and field research centre."
        ),

        (
            "AquaSense Technologies",
            "Industry",
            "Water & Environment",
            "water sensors, IoT, treatment, environmental monitoring",
            "Jamshedpur",
            "Available",
            "Industry partner for water monitoring and IoT deployments."
        ),

        (
            "HealthReach Systems",
            "Industry",
            "Healthcare",
            "telemedicine, mobile diagnostics, health analytics",
            "Ranchi",
            "Available",
            "Technology partner for rural healthcare delivery."
        ),

        (
            "EduBridge Labs",
            "Industry",
            "Education",
            "edtech, multilingual NLP, accessibility, learning platforms",
            "Jamshedpur",
            "Available",
            "Industry partner for inclusive digital education."
        ),

        (
            "GreenMine Solutions",
            "Industry",
            "Environment",
            "mine restoration, GIS, environmental compliance, land reuse",
            "Dhanbad",
            "Available",
            "Environmental technology and post-mining land restoration."
        ),
    ]


    for partner in partners:

        existing = c.execute(
            "SELECT 1 FROM partners WHERE name=?",
            (partner[0],)
        ).fetchone()

        if not existing:

            c.execute(
                """
                INSERT INTO partners(
                    name,
                    partner_type,
                    domain,
                    expertise,
                    location,
                    availability,
                    description
                )
                VALUES(?,?,?,?,?,?,?)
                """,
                partner
            )


    conn.commit()
    conn.close()


init_db()


# ============================================================
# AI / INTELLIGENCE
# ============================================================

DOMAIN_KEYWORDS = {

    "Water & Environment": [
        "water",
        "groundwater",
        "drinking water",
        "river",
        "pollution",
        "contamination",
        "mine",
        "mining",
        "waste",
        "sewage",
        "sanitation",
        "environment",
        "forest",
        "air quality",
        "land",
    ],

    "Healthcare": [
        "health",
        "hospital",
        "doctor",
        "medicine",
        "diagnostic",
        "diagnosis",
        "clinic",
        "ambulance",
        "telemedicine",
        "disease",
        "maternal",
        "medical",
        "healthcare",
    ],

    "Education": [
        "school",
        "student",
        "education",
        "teacher",
        "learning",
        "college",
        "classroom",
        "literacy",
        "digital learning",
        "exam",
        "education access",
    ],

    "Agriculture": [
        "farmer",
        "farming",
        "crop",
        "irrigation",
        "agriculture",
        "soil",
        "pest",
        "seed",
        "livestock",
        "fertilizer",
        "harvest",
    ],

    "Infrastructure": [
        "road",
        "bridge",
        "street",
        "drainage",
        "electricity",
        "transport",
        "traffic",
        "infrastructure",
        "housing",
        "public infrastructure",
    ],

    "Livelihood": [
        "employment",
        "job",
        "livelihood",
        "market",
        "artisan",
        "income",
        "skill",
        "startup",
        "msme",
        "self employment",
    ],

    "Accessibility": [
        "disability",
        "accessible",
        "wheelchair",
        "blind",
        "deaf",
        "sign language",
        "barrier",
        "accessibility",
    ],
}


def categorize(text: str):

    text = text.lower()

    scores = {}

    for domain, words in DOMAIN_KEYWORDS.items():

        score = 0

        for word in words:

            if word in text:

                score += 1

                if " " in word:
                    score += 0.5

        scores[domain] = score


    best = max(scores, key=scores.get)

    if scores[best] == 0:

        return "Public Services", 62


    total = sum(scores.values()) or 1

    confidence = min(
        98,
        round(
            55 +
            (scores[best] / total) * 43
        )
    )

    return best, confidence


# ============================================================
# PRIORITY ENGINE
# ============================================================

def priority_score(
    title: str,
    description: str,
    location: str
):

    text = (
        f"{title} {description}"
    ).lower()

    score = 50


    high_impact = [
        "contaminated",
        "unsafe",
        "death",
        "disease",
        "flood",
        "fire",
        "pollution",
        "drinking water",
        "hospital",
        "emergency",
        "danger",
        "mine",
        "mining",
    ]


    medium = [
        "delay",
        "shortage",
        "broken",
        "lack",
        "poor",
        "access",
        "unavailable",
    ]


    for word in high_impact:

        if word in text:
            score += 6


    for word in medium:

        if word in text:
            score += 3


    if location:

        rural_locations = [
            "rural",
            "village",
            "block",
            "dhanbad",
            "latehar",
            "dumka",
        ]

        if any(
            x in location.lower()
            for x in rural_locations
        ):
            score += 5


    score = min(
        98,
        max(35, score)
    )


    if score >= 90:
        label = "Critical"

    elif score >= 75:
        label = "High"

    elif score >= 55:
        label = "Medium"

    else:
        label = "Low"


    return score, label


# ============================================================
# PROBLEM HELPERS
# ============================================================

def get_problems():

    conn = db()

    rows = conn.execute(
        """
        SELECT *
        FROM problems
        ORDER BY id DESC
        """
    ).fetchall()

    conn.close()

    return [
        dict(row)
        for row in rows
    ]


# ============================================================
# DUPLICATE DETECTION
# ============================================================

def duplicate_matches(
    title,
    description,
    exclude_id=None
):

    rows = get_problems()


    candidates = [
        row
        for row in rows
        if (
            exclude_id is None
            or row["id"] != exclude_id
        )
    ]


    if not candidates:
        return []


    corpus = [
        f'{row["title"]}. {row["description"]}'
        for row in candidates
    ]


    query = [
        f"{title}. {description}"
    ]


    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2)
    )


    try:

        matrix = vectorizer.fit_transform(
            corpus + query
        )

        similarities = cosine_similarity(
            matrix[-1],
            matrix[:-1]
        )[0]

    except Exception:

        return []


    ranked = sorted(
        zip(candidates, similarities),
        key=lambda item: item[1],
        reverse=True
    )


    results = []

    for row, similarity in ranked[:3]:

        if similarity >= 0.22:

            results.append(
                {
                    "problem": row,
                    "similarity": round(
                        float(similarity) * 100
                    ),
                }
            )


    return results


# ============================================================
# PARTNER MATCHING
# ============================================================

def partner_matches(
    domain,
    description,
    location
):

    conn = db()

    partners = [
        dict(row)
        for row in conn.execute(
            "SELECT * FROM partners"
        ).fetchall()
    ]

    conn.close()


    text = (
        f"{domain} {description}"
    ).lower()


    results = []


    for partner in partners:

        score = 45


        # Domain matching

        if (
            partner["domain"].lower() in text
            or
            domain.lower()
            == partner["domain"].lower()
        ):

            score += 30


        # Expertise matching

        expertise = [
            item.strip().lower()
            for item in partner["expertise"].split(",")
        ]


        for item in expertise:

            if item and item in text:
                score += 4


        score = min(score, 93)


        # Location matching

        if (
            location
            and partner["location"]
            and partner["location"]
                .split(",")[0]
                .lower()
                in location.lower()
        ):

            score += 8


        # Availability

        if (
            partner["availability"]
            and
            partner["availability"].lower()
            == "available"
        ):

            score += 5


        score = min(
            99,
            score
        )


        results.append(
            (
                partner,
                score
            )
        )


    results.sort(
        key=lambda item: item[1],
        reverse=True
    )


    return [
        {
            "partner": partner,
            "match_score": score
        }
        for partner, score
        in results[:5]
    ]


# ============================================================
# AUTHENTICATION
# ============================================================

def token_for(user):

    payload = {

        "sub": str(user["id"]),

        "role": user["role"],

        "exp":
            datetime.now(timezone.utc)
            + timedelta(hours=12)
    }


    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def current_user(
    authorization: Optional[str] = Header(
        default=None
    )
):

    # --------------------------------------------------------
    # IMPORTANT FIX:
    #
    # Header(...) tells FastAPI to read:
    #
    # Authorization: Bearer <token>
    #
    # instead of treating "authorization" as a query parameter.
    # --------------------------------------------------------

    if not authorization:

        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )


    if not authorization.startswith(
        "Bearer "
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header"
        )


    token = authorization.split(
        " ",
        1
    )[1].strip()


    if not token:

        raise HTTPException(
            status_code=401,
            detail="Authentication token missing"
        )


    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

    except jwt.ExpiredSignatureError:

        raise HTTPException(
            status_code=401,
            detail="Session expired. Please login again."
        )

    except jwt.InvalidTokenError:

        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )

    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session"
        )


    user_id = payload.get("sub")


    if not user_id:

        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )


    conn = db()

    user = conn.execute(
        """
        SELECT *
        FROM users
        WHERE id=?
        """,
        (user_id,)
    ).fetchone()

    conn.close()


    if not user:

        raise HTTPException(
            status_code=401,
            detail="User not found"
        )


    return dict(user)


# ============================================================
# SCHEMAS
# ============================================================

class LoginIn(BaseModel):

    email: str

    password: str


class ProblemIn(BaseModel):

    title: str = Field(
        min_length=5,
        max_length=160
    )

    description: str = Field(
        min_length=20,
        max_length=5000
    )

    location: str = Field(
        min_length=2,
        max_length=200
    )


class StatusIn(BaseModel):

    status: str

    notes: Optional[str] = ""


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/api/health")
def health():

    return {
        "status": "ok",
        "service": "JanSahyog MVP"
    }


# ============================================================
# LOGIN
# ============================================================

@app.post("/api/login")
def login(data: LoginIn):

    email = data.email.lower().strip()


    conn = db()

    user = conn.execute(
        """
        SELECT *
        FROM users
        WHERE email=?
        """,
        (email,)
    ).fetchone()

    conn.close()


    if not user:

        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )


    try:

        password_valid = pwd_context.verify(
            data.password,
            user["password_hash"]
        )

    except Exception:

        password_valid = False


    if not password_valid:

        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )


    user_dict = dict(user)


    return {
        "token": token_for(user_dict),

        "user": {
            "id": user_dict["id"],
            "name": user_dict["name"],
            "email": user_dict["email"],
            "role": user_dict["role"],
            "organization":
                user_dict["organization"],
            "location":
                user_dict["location"],
        }
    }


# ============================================================
# CURRENT USER
# ============================================================

@app.get("/api/me")
def me(
    authorization: Optional[str] = Header(
        default=None
    )
):

    user = current_user(
        authorization
    )


    return {
        key: user[key]
        for key in [
            "id",
            "name",
            "email",
            "role",
            "organization",
            "location",
        ]
    }


# ============================================================
# GET PROBLEMS
# ============================================================

@app.get("/api/problems")
def problems(
    authorization: Optional[str] = Header(
        default=None
    )
):

    user = current_user(
        authorization
    )


    rows = get_problems()


    # Citizens only see their own problems

    if user["role"] == "Citizen":

        rows = [
            row
            for row in rows
            if row["user_id"]
            == user["id"]
        ]


    return rows


# ============================================================
# CREATE PROBLEM
# ============================================================

@app.post("/api/problems")
def create_problem(
    data: ProblemIn,
    authorization: Optional[str] = Header(
        default=None
    )
):

    user = current_user(
        authorization
    )


    if user["role"] != "Citizen":

        raise HTTPException(
            status_code=403,
            detail="Only citizens can submit problems"
        )


    # --------------------------------------------------------
    # AI DOMAIN CATEGORIZATION
    # --------------------------------------------------------

    domain, confidence = categorize(
        f"{data.title}. {data.description}"
    )


    # --------------------------------------------------------
    # PRIORITY
    # --------------------------------------------------------

    priority, priority_label = priority_score(
        data.title,
        data.description,
        data.location
    )


    # --------------------------------------------------------
    # SAVE PROBLEM
    # --------------------------------------------------------

    conn = db()


    cursor = conn.execute(
        """
        INSERT INTO problems(
            user_id,
            title,
            description,
            location,
            domain,
            priority,
            priority_label,
            status,
            created_at
        )
        VALUES(
            ?,?,?,?,?,?,?,?,?
        )
        """,
        (
            user["id"],
            data.title,
            data.description,
            data.location,
            domain,
            priority,
            priority_label,
            "Submitted",
            datetime.now(
                timezone.utc
            ).isoformat(),
        )
    )


    problem_id = cursor.lastrowid


    conn.commit()
    conn.close()


    # --------------------------------------------------------
    # DUPLICATE DETECTION
    # --------------------------------------------------------

    duplicates = duplicate_matches(
        data.title,
        data.description,
        exclude_id=problem_id
    )


    # --------------------------------------------------------
    # PARTNER MATCHING
    # --------------------------------------------------------

    matches = partner_matches(
        domain,
        data.description,
        data.location
    )


    # --------------------------------------------------------
    # SAVE MATCHES
    # --------------------------------------------------------

    conn = db()


    for match in matches:

        conn.execute(
            """
            INSERT INTO problem_partners(
                problem_id,
                partner_id,
                match_score
            )
            VALUES(?,?,?)
            """,
            (
                problem_id,
                match["partner"]["id"],
                match["match_score"],
            )
        )


    conn.commit()
    conn.close()


    return {

        "id": problem_id,

        "domain": domain,

        "confidence": confidence,

        "priority": priority,

        "priority_label": priority_label,

        "duplicates": duplicates,

        "matches": matches,
    }


# ============================================================
# PROBLEM INTELLIGENCE
# ============================================================

@app.get(
    "/api/problems/{problem_id}/intelligence"
)
def intelligence(
    problem_id: int,

    authorization: Optional[str] = Header(
        default=None
    )
):

    user = current_user(
        authorization
    )


    conn = db()


    problem = conn.execute(
        """
        SELECT *
        FROM problems
        WHERE id=?
        """,
        (problem_id,)
    ).fetchone()


    conn.close()


    if not problem:

        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )


    problem = dict(problem)


    # Citizens can only access their own reports

    if (
        user["role"] == "Citizen"
        and
        problem["user_id"]
        != user["id"]
    ):

        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )


    domain, confidence = categorize(
        f'{problem["title"]}. '
        f'{problem["description"]}'
    )


    duplicates = duplicate_matches(
        problem["title"],
        problem["description"],
        exclude_id=problem["id"]
    )


    matches = partner_matches(
        domain,
        problem["description"],
        problem["location"]
    )


    return {

        "problem": problem,

        "domain": domain,

        "confidence": confidence,

        "duplicates": duplicates,

        "matches": matches,
    }


# ============================================================
# PARTNERS
# ============================================================

@app.get("/api/partners")
def partners(
    authorization: Optional[str] = Header(
        default=None
    )
):

    current_user(
        authorization
    )


    conn = db()


    rows = [
        dict(row)
        for row in conn.execute(
            """
            SELECT *
            FROM partners
            ORDER BY partner_type, name
            """
        ).fetchall()
    ]


    conn.close()


    return rows


# ============================================================
# RECOMMENDATIONS
# ============================================================

@app.get("/api/recommendations")
def recommendations(
    authorization: Optional[str] = Header(
        default=None
    )
):

    user = current_user(
        authorization
    )


    conn = db()


    if user["role"] == "University":

        problems_rows = conn.execute(
            """
            SELECT *
            FROM problems
            ORDER BY priority DESC, id DESC
            """
        ).fetchall()


    elif user["role"] == "Industry":

        problems_rows = conn.execute(
            """
            SELECT *
            FROM problems
            WHERE status != 'Resolved'
            ORDER BY priority DESC, id DESC
            """
        ).fetchall()


    else:

        problems_rows = conn.execute(
            """
            SELECT *
            FROM problems
            ORDER BY priority DESC, id DESC
            """
        ).fetchall()


    partner_rows = conn.execute(
        """
        SELECT *
        FROM partners
        WHERE partner_type=?
        """,
        (user["role"],)
    ).fetchall()


    conn.close()


    partner_names = {
        row["name"]
        for row in partner_rows
    }


    results = []


    for problem in problems_rows:

        problem = dict(problem)


        matches = partner_matches(
            problem["domain"],
            problem["description"],
            problem["location"]
        )


        best = [
            match
            for match in matches
            if match["partner"]["name"]
            in partner_names
        ]


        if best:

            results.append(
                {
                    "problem": problem,
                    "match": best[0],
                }
            )


    return results[:12]


# ============================================================
# ACCEPT COLLABORATION
# ============================================================

@app.post(
    "/api/collaborations/{problem_id}/accept"
)
def accept(
    problem_id: int,

    authorization: Optional[str] = Header(
        default=None
    )
):

    user = current_user(
        authorization
    )


    if user["role"] not in (
        "University",
        "Industry"
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "Only university or "
                "industry partners can "
                "accept challenges"
            )
        )


    conn = db()


    # --------------------------------------------------------
    # IMPORTANT FIX:
    #
    # The original code attempted to query:
    #
    # partners.organization
    #
    # but the partners table has NO organization column.
    #
    # We therefore match the user's organization against
    # the partner's name only.
    # --------------------------------------------------------

    partner = conn.execute(
        """
        SELECT *
        FROM partners
        WHERE partner_type=?
        AND name=?
        """,
        (
            user["role"],
            user["organization"]
        )
    ).fetchone()


    # Fallback to first available partner

    if not partner:

        partner = conn.execute(
            """
            SELECT *
            FROM partners
            WHERE partner_type=?
            AND availability='Available'
            ORDER BY id
            LIMIT 1
            """,
            (user["role"],)
        ).fetchone()


    problem = conn.execute(
        """
        SELECT *
        FROM problems
        WHERE id=?
        """,
        (problem_id,)
    ).fetchone()


    if not problem:

        conn.close()

        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )


    if not partner:

        conn.close()

        raise HTTPException(
            status_code=404,
            detail="No suitable partner found"
        )


    # --------------------------------------------------------
    # Prevent duplicate collaboration records
    # --------------------------------------------------------

    existing = conn.execute(
        """
        SELECT *
        FROM collaborations
        WHERE problem_id=?
        AND partner_id=?
        """,
        (
            problem_id,
            partner["id"]
        )
    ).fetchone()


    if existing:

        conn.execute(
            """
            UPDATE collaborations
            SET status='Accepted',
                notes=?,
                updated_at=?
            WHERE id=?
            """,
            (
                f"Accepted by {user['organization']}",
                datetime.now(
                    timezone.utc
                ).isoformat(),
                existing["id"],
            )
        )

    else:

        conn.execute(
            """
            INSERT INTO collaborations(
                problem_id,
                partner_id,
                status,
                notes,
                updated_at
            )
            VALUES(?,?,?,?,?)
            """,
            (
                problem_id,
                partner["id"],
                "Accepted",
                f"Accepted by {user['organization']}",
                datetime.now(
                    timezone.utc
                ).isoformat(),
            )
        )


    conn.execute(
        """
        UPDATE problems
        SET status='Partner Accepted'
        WHERE id=?
        """,
        (problem_id,)
    )


    conn.commit()
    conn.close()


    return {
        "message": "Challenge accepted",
        "problem_id": problem_id,
        "partner": partner["name"],
        "status": "Partner Accepted",
    }


# ============================================================
# UPDATE COLLABORATION STATUS
# ============================================================

@app.post(
    "/api/collaborations/{problem_id}/status"
)
def update_status(
    problem_id: int,

    data: StatusIn,

    authorization: Optional[str] = Header(
        default=None
    )
):

    user = current_user(
        authorization
    )


    if user["role"] not in (
        "University",
        "Industry",
        "Government"
    ):

        raise HTTPException(
            status_code=403,
            detail="Not permitted"
        )


    allowed_statuses = {

        "Submitted",

        "Under Review",

        "Partner Accepted",

        "In Progress",

        "Pilot / Deployment",

        "Resolved",
    }


    if data.status not in allowed_statuses:

        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )


    conn = db()


    problem = conn.execute(
        """
        SELECT *
        FROM problems
        WHERE id=?
        """,
        (problem_id,)
    ).fetchone()


    if not problem:

        conn.close()

        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )


    # Update problem status

    conn.execute(
        """
        UPDATE problems
        SET status=?
        WHERE id=?
        """,
        (
            data.status,
            problem_id
        )
    )


    # If collaboration exists, update it too

    collaboration = conn.execute(
        """
        SELECT *
        FROM collaborations
        WHERE problem_id=?
        ORDER BY id DESC
        LIMIT 1
        """,
        (problem_id,)
    ).fetchone()


    if collaboration:

        conn.execute(
            """
            UPDATE collaborations
            SET status=?,
                notes=?,
                updated_at=?
            WHERE id=?
            """,
            (
                data.status,
                data.notes or "",
                datetime.now(
                    timezone.utc
                ).isoformat(),
                collaboration["id"],
            )
        )


    conn.commit()
    conn.close()


    return {
        "message": "Status updated",
        "status": data.status,
        "problem_id": problem_id,
    }


# ============================================================
# GOVERNMENT SUMMARY
# ============================================================

@app.get("/api/government/summary")
def government_summary(
    authorization: Optional[str] = Header(
        default=None
    )
):

    user = current_user(
        authorization
    )


    if user["role"] != "Government":

        raise HTTPException(
            status_code=403,
            detail="Government access only"
        )


    conn = db()


    total = conn.execute(
        """
        SELECT COUNT(*) AS c
        FROM problems
        """
    ).fetchone()["c"]


    resolved = conn.execute(
        """
        SELECT COUNT(*) AS c
        FROM problems
        WHERE status='Resolved'
        """
    ).fetchone()["c"]


    active = conn.execute(
        """
        SELECT COUNT(*) AS c
        FROM problems
        WHERE status != 'Resolved'
        """
    ).fetchone()["c"]


    high_priority = conn.execute(
        """
        SELECT COUNT(*) AS c
        FROM problems
        WHERE priority >= 75
        """
    ).fetchone()["c"]


    domains = [
        dict(row)
        for row in conn.execute(
            """
            SELECT
                domain,
                COUNT(*) AS count
            FROM problems
            GROUP BY domain
            ORDER BY count DESC
            """
        ).fetchall()
    ]


    statuses = [
        dict(row)
        for row in conn.execute(
            """
            SELECT
                status,
                COUNT(*) AS count
            FROM problems
            GROUP BY status
            ORDER BY count DESC
            """
        ).fetchall()
    ]


    top_problems = [
        dict(row)
        for row in conn.execute(
            """
            SELECT
                id,
                title,
                domain,
                priority,
                priority_label,
                status,
                location
            FROM problems
            ORDER BY priority DESC
            LIMIT 6
            """
        ).fetchall()
    ]


    conn.close()


    return {

        "total": total,

        "resolved": resolved,

        "active": active,

        "high_priority": high_priority,

        "domains": domains,

        "statuses": statuses,

        "top": top_problems,
    }


# ============================================================
# FILE UPLOAD
# ============================================================

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),

    authorization: Optional[str] = Header(
        default=None
    )
):

    current_user(
        authorization
    )


    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file selected"
        )


    allowed_extensions = {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    }


    extension = os.path.splitext(
        file.filename
    )[1].lower()


    if extension not in allowed_extensions:

        raise HTTPException(
            status_code=400,
            detail=(
                "Only JPG, JPEG, PNG "
                "and WEBP images are allowed"
            )
        )


    # Generate a safe unique filename

    timestamp = datetime.now(
        timezone.utc
    ).strftime("%Y%m%d%H%M%S%f")


    safe_filename = (
        f"{timestamp}{extension}"
    )


    file_path = os.path.join(
        UPLOAD_DIR,
        safe_filename
    )


    contents = await file.read()


    # 10 MB limit

    max_size = 10 * 1024 * 1024


    if len(contents) > max_size:

        raise HTTPException(
            status_code=400,
            detail="File size must be below 10 MB"
        )


    with open(
        file_path,
        "wb"
    ) as output:

        output.write(contents)


    return {

        "message": "File uploaded successfully",

        "filename": safe_filename,

        "path": f"/uploads/{safe_filename}",
    }


# ============================================================
# SERVE UPLOADED FILES
# ============================================================

app.mount(
    "/uploads",
    StaticFiles(directory=UPLOAD_DIR),
    name="uploads"
)


# ============================================================
# SERVE FRONTEND
# ============================================================
@app.get("/assets-test")
def assets_test():
    image_path = os.path.join(
        STATIC_DIR,
        "assets",
        "jharmitra.png"
    )

    if not os.path.isfile(image_path):
        raise HTTPException(
            status_code=404,
            detail=f"Image not found: {image_path}"
        )

    return FileResponse(
        image_path,
        media_type="image/png"
    )
if os.path.exists(STATIC_DIR):

    app.mount(
        "/static",
        StaticFiles(directory=STATIC_DIR),
        name="static"
    )
    # Serve frontend/assets explicitly
    ASSETS_DIR = os.path.join(
        STATIC_DIR,
        "assets"
    )

    if os.path.exists(ASSETS_DIR):

        app.mount(
            "/assets",
            StaticFiles(directory=ASSETS_DIR),
            name="assets"
        )


    @app.get("/{path:path}")
    def frontend(path: str):

        return FileResponse(
            os.path.join(
                STATIC_DIR,
                "index.html"
            )
        )

else:

    @app.get("/")
    def frontend_missing():

        return {
            "message": "JanSahyog backend is running",
            "frontend": "Frontend directory not found",
        }
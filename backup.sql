--
-- PostgreSQL database dump
--

\restrict Zlq30dfaMcPCc0H4LfGXU6iDohHuZURNyjbLiU9ujfE0VhqwxJMnM33vRZMGk9b

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: booking_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.booking_status AS ENUM (
    'pending_payment',
    'confirmed',
    'completed',
    'cancelled',
    'refunded',
    'unvisited'
);


ALTER TYPE public.booking_status OWNER TO postgres;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'paid',
    'refunded'
);


ALTER TYPE public.payment_status OWNER TO postgres;

--
-- Name: session_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.session_status AS ENUM (
    'upcoming',
    'active',
    'closed',
    'cancelled'
);


ALTER TYPE public.session_status OWNER TO postgres;

--
-- Name: session_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.session_type AS ENUM (
    'morning',
    'afternoon',
    'evening'
);


ALTER TYPE public.session_type OWNER TO postgres;

--
-- Name: token_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.token_status AS ENUM (
    'available',
    'booked',
    'ongoing',
    'completed',
    'skipped',
    'unvisited'
);


ALTER TYPE public.token_status OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'patient',
    'doctor'
);


ALTER TYPE public.user_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    session_id integer NOT NULL,
    token_number integer NOT NULL,
    status public.booking_status DEFAULT 'pending_payment'::public.booking_status NOT NULL,
    payment_status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    amount_paid numeric(10,2),
    transaction_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    chief_complaint text
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bookings_id_seq OWNER TO postgres;

--
-- Name: bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bookings_id_seq OWNED BY public.bookings.id;


--
-- Name: doctors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctors (
    id integer NOT NULL,
    user_id integer NOT NULL,
    hospital_id integer NOT NULL,
    name text NOT NULL,
    specialty text NOT NULL,
    photo_url text,
    bio text,
    consultation_fee numeric(10,2) DEFAULT '500'::numeric NOT NULL,
    tokens_per_session integer DEFAULT 20 NOT NULL,
    session_types jsonb DEFAULT '[]'::jsonb,
    login_code text NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.doctors OWNER TO postgres;

--
-- Name: doctors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctors_id_seq OWNER TO postgres;

--
-- Name: doctors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctors_id_seq OWNED BY public.doctors.id;


--
-- Name: hospitals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hospitals (
    id integer NOT NULL,
    name text NOT NULL,
    location text NOT NULL,
    address text NOT NULL,
    phone text,
    image_url text,
    specialties text[] DEFAULT '{}'::text[],
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    photos text[] DEFAULT '{}'::text[]
);


ALTER TABLE public.hospitals OWNER TO postgres;

--
-- Name: hospitals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hospitals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hospitals_id_seq OWNER TO postgres;

--
-- Name: hospitals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hospitals_id_seq OWNED BY public.hospitals.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    date date NOT NULL,
    session_type public.session_type NOT NULL,
    start_time text NOT NULL,
    end_time text NOT NULL,
    total_tokens integer NOT NULL,
    booked_tokens integer DEFAULT 0 NOT NULL,
    status public.session_status DEFAULT 'upcoming'::public.session_status NOT NULL,
    is_cancelled boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sessions_id_seq OWNER TO postgres;

--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tokens (
    id integer NOT NULL,
    session_id integer NOT NULL,
    token_number integer NOT NULL,
    status public.token_status DEFAULT 'available'::public.token_status NOT NULL,
    is_buffer boolean DEFAULT false NOT NULL,
    patient_name text,
    patient_phone text,
    booking_id integer,
    notification_sent boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tokens OWNER TO postgres;

--
-- Name: tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tokens_id_seq OWNER TO postgres;

--
-- Name: tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tokens_id_seq OWNED BY public.tokens.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    role public.user_role DEFAULT 'patient'::public.user_role NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: bookings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings ALTER COLUMN id SET DEFAULT nextval('public.bookings_id_seq'::regclass);


--
-- Name: doctors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors ALTER COLUMN id SET DEFAULT nextval('public.doctors_id_seq'::regclass);


--
-- Name: hospitals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitals ALTER COLUMN id SET DEFAULT nextval('public.hospitals_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens ALTER COLUMN id SET DEFAULT nextval('public.tokens_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bookings (id, patient_id, session_id, token_number, status, payment_status, amount_paid, transaction_id, created_at, updated_at, chief_complaint) FROM stdin;
1	8	7	6	confirmed	paid	500.00	\N	2026-03-12 14:09:58.235528	2026-03-12 14:09:58.235528	\N
2	8	3	11	confirmed	paid	500.00	\N	2026-03-12 15:48:14.581291	2026-03-12 15:48:14.581291	Fever
3	8	7	7	confirmed	paid	500.00	\N	2026-03-12 17:06:57.53773	2026-03-12 17:06:57.53773	\N
4	8	7	8	confirmed	paid	500.00	\N	2026-03-12 17:32:52.795338	2026-03-12 17:32:52.795338	\N
5	48	1	5	confirmed	paid	500.00	\N	2026-03-12 17:36:15.643557	2026-03-12 17:36:15.643557	\N
\.


--
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctors (id, user_id, hospital_id, name, specialty, photo_url, bio, consultation_fee, tokens_per_session, session_types, login_code, is_available, created_at) FROM stdin;
5	5	4	Dr. Vikram Rao	Neurology	/images/doctor-placeholder.png	Neurologist with expertise in stroke, epilepsy and movement disorders. 18 years clinical experience.	800.00	15	[{"type": "morning", "endTime": "13:00", "isActive": true, "startTime": "10:00"}, {"type": "evening", "endTime": "20:00", "isActive": true, "startTime": "18:00"}]	DOC005	t	2026-03-12 04:41:43.174994
6	6	1	Dr. Lakshmi Devi	Orthopedics	/images/doctor-placeholder.png	Orthopedic surgeon specializing in joint replacement and spine surgery. MBBS, MS Ortho, Fellowship UK.	750.00	18	[{"type": "morning", "endTime": "12:00", "isActive": true, "startTime": "09:00"}, {"type": "afternoon", "endTime": "17:00", "isActive": true, "startTime": "14:00"}, {"type": "evening", "endTime": "20:00", "isActive": true, "startTime": "18:00"}]	DOC006	t	2026-03-12 04:41:43.178082
1	1	1	Dr. Ramesh Kumar	Cardiology	/images/doctor-placeholder.png	15+ years experience in interventional cardiology. MBBS, MD, DM Cardiology from AIIMS.	150.00	20	[{"type": "morning", "endTime": "12:00", "isActive": true, "startTime": "09:00"}, {"type": "afternoon", "endTime": "17:00", "isActive": true, "startTime": "14:00"}, {"type": "evening", "endTime": "20:00", "isActive": true, "startTime": "18:00"}]	DOC001	t	2026-03-12 04:41:43.162199
2	2	1	Dr. Priya Nair	Pediatrics	/images/doctor-placeholder.png	Child specialist with 10 years experience. MBBS, MD Pediatrics, Fellowship in Neonatology.	500.00	25	[{"type": "morning", "endTime": "13:00", "isActive": true, "startTime": "09:00"}, {"type": "evening", "endTime": "20:00", "isActive": true, "startTime": "17:00"}]	DOC002	t	2026-03-12 04:41:43.166029
3	3	2	Dr. Arjun Singh	Physiotherapy	/images/doctor-placeholder.png	Sports medicine & rehabilitation specialist. 12 years experience treating athletes and post-surgery patients.	400.00	15	[{"type": "morning", "endTime": "11:00", "isActive": true, "startTime": "08:00"}, {"type": "afternoon", "endTime": "18:00", "isActive": true, "startTime": "15:00"}]	DOC003	t	2026-03-12 04:41:43.169667
7	13	1	Dr. Test Doctor	General Medicine	\N	\N	400.00	15	[{"type": "morning", "endTime": "12:00", "isActive": true, "startTime": "09:00"}, {"type": "afternoon", "endTime": "17:00", "isActive": false, "startTime": "14:00"}]	DOC-00007	t	2026-03-12 16:46:05.203827
41	47	5	Dr.Kaliraj	paediatrician	\N	\N	100.00	20	[{"type": "morning", "endTime": "12:00", "isActive": true, "startTime": "09:00"}, {"type": "afternoon", "endTime": "17:00", "isActive": false, "startTime": "14:00"}]	DOC-00041	t	2026-03-12 17:00:52.354281
40	46	5	Dr. E2E Test	General Medicine	\N	\N	500.00	20	[{"type": "morning", "endTime": "12:00", "isActive": true, "startTime": "09:00"}, {"type": "afternoon", "endTime": "17:00", "isActive": false, "startTime": "14:00"}]	DOC-00008	t	2026-03-12 16:52:25.275151
4	4	3	Dr. Sneha Mehta	Dermatology	/images/doctor-placeholder.png	Skin care expert and cosmetologist. MBBS, MD Dermatology. Specialises in acne, psoriasis, and cosmetic procedures.	700.00	20	[{"type": "afternoon", "endTime": "17:00", "isActive": true, "startTime": "13:00"}]	DOC004	t	2026-03-12 04:41:43.172383
\.


--
-- Data for Name: hospitals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hospitals (id, name, location, address, phone, image_url, specialties, created_at, photos) FROM stdin;
1	Apollo Medical Centre	Chennai	21 Greams Lane, Thousand Lights, Chennai - 600006	+91 44 2829 0200	/images/hospital-placeholder.png	{Cardiology,Neurology,Pediatrics,Orthopedics,Dermatology}	2026-03-12 04:41:43.120558	{}
2	Fortis Healthcare	Bangalore	154/9 Bannerghatta Road, Bangalore - 560076	+91 80 6621 4444	/images/hospital-placeholder.png	{Oncology,Cardiology,Physiotherapy,Dermatology,ENT}	2026-03-12 04:41:43.131934	{}
3	AIIMS Delhi	New Delhi	Sri Aurobindo Marg, Ansari Nagar, New Delhi - 110029	+91 11 2658 8500	/images/hospital-placeholder.png	{"General Medicine",Surgery,Pediatrics,Orthopedics,Psychiatry}	2026-03-12 04:41:43.135526	{}
4	Manipal Hospitals	Hyderabad	5-9-22 Secretariat Road, Hyderabad - 500063	+91 40 4024 4424	/images/hospital-placeholder.png	{Cardiology,Neurology,Orthopedics,Nephrology,Gastroenterology}	2026-03-12 04:41:43.138932	{}
5	Test Clinic	Chennai	123 Test Street	\N	\N	{}	2026-03-12 16:46:05.258588	{}
38	E2E Test Clinic	Bengaluru	123 Test Road	9000000002	\N	{}	2026-03-12 16:53:56.293153	{}
39	kishore hospital	Virudhunagar	186,Mariamman kovil st , Srivilliputtur	9342311397	\N	{}	2026-03-12 17:05:29.697518	{}
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, doctor_id, date, session_type, start_time, end_time, total_tokens, booked_tokens, status, is_cancelled, created_at) FROM stdin;
4	3	2026-03-14	morning	08:00	11:00	15	3	upcoming	f	2026-03-12 04:41:43.182071
5	4	2026-03-14	afternoon	13:00	17:00	20	7	upcoming	f	2026-03-12 04:41:43.182071
6	5	2026-03-15	morning	10:00	13:00	15	2	upcoming	f	2026-03-12 04:41:43.182071
11	2	2026-03-12	morning	09:00	12:00	20	0	upcoming	f	2026-03-12 07:16:42.649692
12	1	2026-03-13	morning	09:00	12:00	50	0	upcoming	f	2026-03-12 12:33:23.680091
14	1	2026-03-13	afternoon	14:00	17:00	20	0	upcoming	f	2026-03-12 13:14:42.54299
15	1	2026-03-12	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
16	1	2026-03-12	afternoon	14:00	17:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
17	1	2026-03-13	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
18	1	2026-03-13	afternoon	14:00	17:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
19	1	2026-03-14	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
20	1	2026-03-14	afternoon	14:00	17:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
21	1	2026-03-15	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
22	1	2026-03-15	afternoon	14:00	17:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
23	1	2026-03-16	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
24	1	2026-03-16	afternoon	14:00	17:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
25	2	2026-03-12	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
26	2	2026-03-12	afternoon	14:00	17:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
27	2	2026-03-13	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
28	2	2026-03-13	afternoon	14:00	17:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
29	2	2026-03-14	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
30	2	2026-03-14	afternoon	14:00	17:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
31	2	2026-03-15	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
32	2	2026-03-15	afternoon	14:00	17:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
33	2	2026-03-16	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
34	2	2026-03-16	afternoon	14:00	17:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
35	3	2026-03-12	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
36	3	2026-03-12	afternoon	14:00	17:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
37	3	2026-03-13	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
38	3	2026-03-13	afternoon	14:00	17:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
39	3	2026-03-14	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
40	3	2026-03-14	afternoon	14:00	17:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
41	3	2026-03-15	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
42	3	2026-03-15	afternoon	14:00	17:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
43	3	2026-03-16	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
44	3	2026-03-16	afternoon	14:00	17:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
45	4	2026-03-12	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
46	4	2026-03-13	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
47	4	2026-03-14	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
48	4	2026-03-15	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
49	4	2026-03-16	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
50	5	2026-03-12	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
51	5	2026-03-13	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
52	5	2026-03-14	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
53	5	2026-03-15	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
54	5	2026-03-16	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
55	6	2026-03-12	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
56	6	2026-03-13	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
57	6	2026-03-14	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
58	6	2026-03-15	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
59	6	2026-03-16	morning	09:00	12:00	15	0	upcoming	f	2026-03-12 13:42:35.617937
60	1	2026-03-12	morning	09:00	12:00	49	0	upcoming	f	2026-03-12 14:13:10.144845
9	1	2026-03-12	evening	18:00	20:00	20	0	closed	f	2026-03-12 04:57:45.013973
10	1	2026-03-12	morning	09:00	12:00	39	0	closed	f	2026-03-12 07:16:11.559249
3	2	2026-03-13	morning	09:00	13:00	25	11	upcoming	f	2026-03-12 04:41:43.182071
8	1	2026-03-13	morning	09:00	12:00	22	0	cancelled	t	2026-03-12 04:56:20.726127
2	1	2026-03-13	afternoon	14:00	17:00	20	0	cancelled	t	2026-03-12 04:41:43.182071
13	1	2026-03-13	morning	09:00	12:00	20	0	cancelled	t	2026-03-12 13:14:16.774273
61	1	2026-03-12	afternoon	14:00	17:00	20	0	cancelled	t	2026-03-12 14:13:19.535567
7	6	2026-03-13	evening	18:00	20:00	18	8	upcoming	f	2026-03-12 04:41:43.182071
1	1	2026-03-13	morning	09:00	12:00	20	5	upcoming	f	2026-03-12 04:41:43.182071
65	41	2026-03-12	morning	09:00	12:00	20	20	active	f	2026-03-12 17:38:05.625364
\.


--
-- Data for Name: tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tokens (id, session_id, token_number, status, is_buffer, patient_name, patient_phone, booking_id, notification_sent, created_at, updated_at) FROM stdin;
1	10	1	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
2	10	2	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
3	10	3	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
4	10	4	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
5	10	5	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
6	10	6	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
7	10	7	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
8	10	8	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
9	10	9	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
10	10	10	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
11	10	11	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
12	10	12	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
13	10	13	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
14	10	14	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
15	10	15	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
16	10	16	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
17	10	17	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
18	10	18	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
19	10	19	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
20	10	20	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
21	10	21	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
22	10	22	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
23	10	23	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
24	10	24	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
25	10	25	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
26	10	26	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
27	10	27	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
28	10	28	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
29	10	29	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
30	10	30	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
31	10	31	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
32	10	32	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
33	10	33	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
34	10	34	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
35	10	35	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
36	10	36	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
37	10	37	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
38	10	38	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
39	10	39	available	f	\N	\N	\N	f	2026-03-12 07:16:11.604875	2026-03-12 07:16:11.604875
40	11	1	available	f	\N	\N	\N	f	2026-03-12 07:16:42.656067	2026-03-12 07:16:42.656067
41	11	2	available	f	\N	\N	\N	f	2026-03-12 07:16:42.656067	2026-03-12 07:16:42.656067
42	11	3	available	f	\N	\N	\N	f	2026-03-12 07:16:42.656067	2026-03-12 07:16:42.656067
43	11	4	available	f	\N	\N	\N	f	2026-03-12 07:16:42.656067	2026-03-12 07:16:42.656067
44	11	5	available	f	\N	\N	\N	f	2026-03-12 07:16:42.656067	2026-03-12 07:16:42.656067
45	11	6	available	f	\N	\N	\N	f	2026-03-12 07:16:42.656067	2026-03-12 07:16:42.656067
46	11	7	available	f	\N	\N	\N	f	2026-03-12 07:16:42.656067	2026-03-12 07:16:42.656067
47	11	8	available	f	\N	\N	\N	f	2026-03-12 07:16:42.656067	2026-03-12 07:16:42.656067
48	11	9	available	f	\N	\N	\N	f	2026-03-12 07:16:42.656067	2026-03-12 07:16:42.656067
49	11	10	available	f	\N	\N	\N	f	2026-03-12 07:16:42.656067	2026-03-12 07:16:42.656067
50	11	11	available	f	\N	\N	\N	f	2026-03-12 07:16:42.656067	2026-03-12 07:16:42.656067
51	11	12	available	f	\N	\N	\N	f	2026-03-12 07:16:42.656067	2026-03-12 07:16:42.656067
52	11	13	available	f	\N	\N	\N	f	2026-03-12 07:16:42.656067	2026-03-12 07:16:42.656067
53	11	14	available	f	\N	\N	\N	f	2026-03-12 07:16:42.656067	2026-03-12 07:16:42.656067
54	11	15	available	f	\N	\N	\N	f	2026-03-12 07:16:42.656067	2026-03-12 07:16:42.656067
55	11	16	available	f	\N	\N	\N	f	2026-03-12 07:16:42.656067	2026-03-12 07:16:42.656067
56	11	17	available	f	\N	\N	\N	f	2026-03-12 07:16:42.656067	2026-03-12 07:16:42.656067
57	11	18	available	f	\N	\N	\N	f	2026-03-12 07:16:42.656067	2026-03-12 07:16:42.656067
58	11	19	available	f	\N	\N	\N	f	2026-03-12 07:16:42.656067	2026-03-12 07:16:42.656067
59	11	20	available	f	\N	\N	\N	f	2026-03-12 07:16:42.656067	2026-03-12 07:16:42.656067
60	1	1	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
61	1	2	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
62	1	3	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
63	1	4	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
65	1	6	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
66	1	7	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
67	1	8	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
68	1	9	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
69	1	10	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
70	1	11	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
71	1	12	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
72	1	13	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
73	1	14	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
74	1	15	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
75	1	16	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
76	1	17	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
77	1	18	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
78	1	19	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
79	1	20	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
80	2	1	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
81	2	2	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
82	2	3	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
83	2	4	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
84	2	5	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
85	2	6	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
86	2	7	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
87	2	8	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
88	2	9	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
89	2	10	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
90	2	11	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
91	2	12	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
92	2	13	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
93	2	14	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
94	2	15	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
95	2	16	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
96	2	17	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
97	2	18	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
98	2	19	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
99	2	20	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
100	3	1	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
101	3	2	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
102	3	3	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
103	3	4	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
104	3	5	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
105	3	6	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
106	3	7	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
107	3	8	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
108	3	9	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
109	3	10	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
111	3	12	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
112	3	13	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
113	3	14	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
114	3	15	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
115	3	16	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
116	3	17	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
117	3	18	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
118	3	19	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
119	3	20	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
120	3	21	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
121	3	22	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
122	3	23	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
123	3	24	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
124	3	25	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
125	4	1	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
126	4	2	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
127	4	3	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
128	4	4	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
129	4	5	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
130	4	6	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
131	4	7	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
132	4	8	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
133	4	9	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
134	4	10	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
135	4	11	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
136	4	12	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
137	4	13	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
138	4	14	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
139	4	15	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
140	5	1	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
141	5	2	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
142	5	3	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
143	5	4	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
144	5	5	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
145	5	6	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
146	5	7	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
147	5	8	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
148	5	9	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
149	5	10	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
150	5	11	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
151	5	12	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
152	5	13	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
153	5	14	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
154	5	15	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
155	5	16	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
156	5	17	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
157	5	18	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
158	5	19	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
159	5	20	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
160	6	1	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
161	6	2	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
162	6	3	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
163	6	4	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
164	6	5	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
165	6	6	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
166	6	7	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
167	6	8	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
168	6	9	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
169	6	10	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
170	6	11	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
171	6	12	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
172	6	13	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
173	6	14	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
174	6	15	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
175	7	1	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
176	7	2	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
177	7	3	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
178	7	4	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
179	7	5	booked	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
183	7	9	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
184	7	10	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
185	7	11	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
186	7	12	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
187	7	13	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
188	7	14	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
189	7	15	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
190	7	16	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
191	7	17	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
192	7	18	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
193	8	1	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
194	8	2	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
195	8	3	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
196	8	4	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
197	8	5	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
198	8	6	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
199	8	7	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
200	8	8	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
201	8	9	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
202	8	10	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
203	8	11	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
204	8	12	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
205	8	13	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
206	8	14	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
207	8	15	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
208	8	16	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
209	8	17	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
210	8	18	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
211	8	19	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
212	8	20	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
213	8	21	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
214	8	22	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
110	3	11	booked	f	\N	\N	2	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
181	7	7	booked	f	\N	\N	3	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
182	7	8	booked	f	\N	\N	4	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
215	9	1	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
216	9	2	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
217	9	3	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
218	9	4	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
219	9	5	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
220	9	6	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
221	9	7	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
222	9	8	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
223	9	9	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
224	9	10	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
225	9	11	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
226	9	12	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
227	9	13	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
228	9	14	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
229	9	15	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
230	9	16	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
231	9	17	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
232	9	18	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
233	9	19	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
234	9	20	available	f	\N	\N	\N	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
235	12	1	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
236	12	2	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
237	12	3	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
238	12	4	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
239	12	5	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
240	12	6	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
241	12	7	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
242	12	8	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
243	12	9	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
244	12	10	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
245	12	11	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
246	12	12	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
247	12	13	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
248	12	14	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
249	12	15	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
250	12	16	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
251	12	17	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
252	12	18	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
253	12	19	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
254	12	20	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
255	12	21	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
256	12	22	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
257	12	23	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
258	12	24	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
259	12	25	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
260	12	26	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
261	12	27	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
262	12	28	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
263	12	29	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
264	12	30	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
265	12	31	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
266	12	32	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
267	12	33	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
268	12	34	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
269	12	35	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
270	12	36	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
271	12	37	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
272	12	38	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
273	12	39	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
274	12	40	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
275	12	41	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
276	12	42	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
277	12	43	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
278	12	44	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
279	12	45	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
280	12	46	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
281	12	47	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
282	12	48	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
283	12	49	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
284	12	50	available	f	\N	\N	\N	f	2026-03-12 12:33:23.766264	2026-03-12 12:33:23.766264
285	13	1	available	f	\N	\N	\N	f	2026-03-12 13:14:16.81042	2026-03-12 13:14:16.81042
286	13	2	available	f	\N	\N	\N	f	2026-03-12 13:14:16.81042	2026-03-12 13:14:16.81042
287	13	3	available	f	\N	\N	\N	f	2026-03-12 13:14:16.81042	2026-03-12 13:14:16.81042
288	13	4	available	f	\N	\N	\N	f	2026-03-12 13:14:16.81042	2026-03-12 13:14:16.81042
289	13	5	available	f	\N	\N	\N	f	2026-03-12 13:14:16.81042	2026-03-12 13:14:16.81042
290	13	6	available	f	\N	\N	\N	f	2026-03-12 13:14:16.81042	2026-03-12 13:14:16.81042
291	13	7	available	f	\N	\N	\N	f	2026-03-12 13:14:16.81042	2026-03-12 13:14:16.81042
292	13	8	available	f	\N	\N	\N	f	2026-03-12 13:14:16.81042	2026-03-12 13:14:16.81042
293	13	9	available	f	\N	\N	\N	f	2026-03-12 13:14:16.81042	2026-03-12 13:14:16.81042
294	13	10	available	f	\N	\N	\N	f	2026-03-12 13:14:16.81042	2026-03-12 13:14:16.81042
295	13	11	available	f	\N	\N	\N	f	2026-03-12 13:14:16.81042	2026-03-12 13:14:16.81042
296	13	12	available	f	\N	\N	\N	f	2026-03-12 13:14:16.81042	2026-03-12 13:14:16.81042
297	13	13	available	f	\N	\N	\N	f	2026-03-12 13:14:16.81042	2026-03-12 13:14:16.81042
298	13	14	available	f	\N	\N	\N	f	2026-03-12 13:14:16.81042	2026-03-12 13:14:16.81042
299	13	15	available	f	\N	\N	\N	f	2026-03-12 13:14:16.81042	2026-03-12 13:14:16.81042
300	13	16	available	f	\N	\N	\N	f	2026-03-12 13:14:16.81042	2026-03-12 13:14:16.81042
301	13	17	available	f	\N	\N	\N	f	2026-03-12 13:14:16.81042	2026-03-12 13:14:16.81042
302	13	18	available	f	\N	\N	\N	f	2026-03-12 13:14:16.81042	2026-03-12 13:14:16.81042
303	13	19	available	f	\N	\N	\N	f	2026-03-12 13:14:16.81042	2026-03-12 13:14:16.81042
304	13	20	available	f	\N	\N	\N	f	2026-03-12 13:14:16.81042	2026-03-12 13:14:16.81042
305	14	1	available	f	\N	\N	\N	f	2026-03-12 13:14:42.548532	2026-03-12 13:14:42.548532
306	14	2	available	f	\N	\N	\N	f	2026-03-12 13:14:42.548532	2026-03-12 13:14:42.548532
307	14	3	available	f	\N	\N	\N	f	2026-03-12 13:14:42.548532	2026-03-12 13:14:42.548532
308	14	4	available	f	\N	\N	\N	f	2026-03-12 13:14:42.548532	2026-03-12 13:14:42.548532
309	14	5	available	f	\N	\N	\N	f	2026-03-12 13:14:42.548532	2026-03-12 13:14:42.548532
310	14	6	available	f	\N	\N	\N	f	2026-03-12 13:14:42.548532	2026-03-12 13:14:42.548532
311	14	7	available	f	\N	\N	\N	f	2026-03-12 13:14:42.548532	2026-03-12 13:14:42.548532
312	14	8	available	f	\N	\N	\N	f	2026-03-12 13:14:42.548532	2026-03-12 13:14:42.548532
313	14	9	available	f	\N	\N	\N	f	2026-03-12 13:14:42.548532	2026-03-12 13:14:42.548532
314	14	10	available	f	\N	\N	\N	f	2026-03-12 13:14:42.548532	2026-03-12 13:14:42.548532
315	14	11	available	f	\N	\N	\N	f	2026-03-12 13:14:42.548532	2026-03-12 13:14:42.548532
316	14	12	available	f	\N	\N	\N	f	2026-03-12 13:14:42.548532	2026-03-12 13:14:42.548532
317	14	13	available	f	\N	\N	\N	f	2026-03-12 13:14:42.548532	2026-03-12 13:14:42.548532
318	14	14	available	f	\N	\N	\N	f	2026-03-12 13:14:42.548532	2026-03-12 13:14:42.548532
319	14	15	available	f	\N	\N	\N	f	2026-03-12 13:14:42.548532	2026-03-12 13:14:42.548532
320	14	16	available	f	\N	\N	\N	f	2026-03-12 13:14:42.548532	2026-03-12 13:14:42.548532
321	14	17	available	f	\N	\N	\N	f	2026-03-12 13:14:42.548532	2026-03-12 13:14:42.548532
322	14	18	available	f	\N	\N	\N	f	2026-03-12 13:14:42.548532	2026-03-12 13:14:42.548532
323	14	19	available	f	\N	\N	\N	f	2026-03-12 13:14:42.548532	2026-03-12 13:14:42.548532
324	14	20	available	f	\N	\N	\N	f	2026-03-12 13:14:42.548532	2026-03-12 13:14:42.548532
180	7	6	booked	f	\N	\N	1	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
325	60	1	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
326	60	2	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
327	60	3	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
328	60	4	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
329	60	5	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
330	60	6	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
331	60	7	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
332	60	8	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
333	60	9	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
334	60	10	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
335	60	11	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
336	60	12	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
337	60	13	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
338	60	14	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
339	60	15	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
340	60	16	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
341	60	17	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
342	60	18	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
343	60	19	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
344	60	20	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
345	60	21	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
346	60	22	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
347	60	23	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
348	60	24	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
349	60	25	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
350	60	26	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
351	60	27	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
352	60	28	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
353	60	29	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
354	60	30	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
355	60	31	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
356	60	32	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
357	60	33	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
358	60	34	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
359	60	35	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
360	60	36	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
361	60	37	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
362	60	38	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
363	60	39	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
364	60	40	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
365	60	41	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
366	60	42	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
367	60	43	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
368	60	44	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
369	60	45	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
370	60	46	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
371	60	47	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
372	60	48	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
373	60	49	available	f	\N	\N	\N	f	2026-03-12 14:13:10.153457	2026-03-12 14:13:10.153457
374	61	1	available	f	\N	\N	\N	f	2026-03-12 14:13:19.539799	2026-03-12 14:13:19.539799
375	61	2	available	f	\N	\N	\N	f	2026-03-12 14:13:19.539799	2026-03-12 14:13:19.539799
376	61	3	available	f	\N	\N	\N	f	2026-03-12 14:13:19.539799	2026-03-12 14:13:19.539799
377	61	4	available	f	\N	\N	\N	f	2026-03-12 14:13:19.539799	2026-03-12 14:13:19.539799
378	61	5	available	f	\N	\N	\N	f	2026-03-12 14:13:19.539799	2026-03-12 14:13:19.539799
379	61	6	available	f	\N	\N	\N	f	2026-03-12 14:13:19.539799	2026-03-12 14:13:19.539799
380	61	7	available	f	\N	\N	\N	f	2026-03-12 14:13:19.539799	2026-03-12 14:13:19.539799
381	61	8	available	f	\N	\N	\N	f	2026-03-12 14:13:19.539799	2026-03-12 14:13:19.539799
382	61	9	available	f	\N	\N	\N	f	2026-03-12 14:13:19.539799	2026-03-12 14:13:19.539799
383	61	10	available	f	\N	\N	\N	f	2026-03-12 14:13:19.539799	2026-03-12 14:13:19.539799
384	61	11	available	f	\N	\N	\N	f	2026-03-12 14:13:19.539799	2026-03-12 14:13:19.539799
385	61	12	available	f	\N	\N	\N	f	2026-03-12 14:13:19.539799	2026-03-12 14:13:19.539799
386	61	13	available	f	\N	\N	\N	f	2026-03-12 14:13:19.539799	2026-03-12 14:13:19.539799
387	61	14	available	f	\N	\N	\N	f	2026-03-12 14:13:19.539799	2026-03-12 14:13:19.539799
388	61	15	available	f	\N	\N	\N	f	2026-03-12 14:13:19.539799	2026-03-12 14:13:19.539799
389	61	16	available	f	\N	\N	\N	f	2026-03-12 14:13:19.539799	2026-03-12 14:13:19.539799
390	61	17	available	f	\N	\N	\N	f	2026-03-12 14:13:19.539799	2026-03-12 14:13:19.539799
391	61	18	available	f	\N	\N	\N	f	2026-03-12 14:13:19.539799	2026-03-12 14:13:19.539799
392	61	19	available	f	\N	\N	\N	f	2026-03-12 14:13:19.539799	2026-03-12 14:13:19.539799
393	61	20	available	f	\N	\N	\N	f	2026-03-12 14:13:19.539799	2026-03-12 14:13:19.539799
394	9	1008	skipped	t	senthil nathan	994077452	\N	f	2026-03-12 14:13:44.178919	2026-03-12 14:13:44.178919
395	10	1005	ongoing	t	senthil	9940774524	\N	f	2026-03-12 15:50:36.736267	2026-03-12 15:50:36.736267
64	1	5	booked	f	\N	\N	5	f	2026-03-12 12:21:23.422178	2026-03-12 12:21:23.422178
451	65	1	completed	f	Test Patient	\N	\N	t	2026-03-12 17:38:05.664651	2026-03-12 17:38:05.664651
452	65	2	completed	f	John Doe	\N	\N	t	2026-03-12 17:38:05.664651	2026-03-12 17:38:05.664651
453	65	3	completed	f	John Doe	\N	\N	t	2026-03-12 17:38:05.664651	2026-03-12 17:38:05.664651
454	65	4	completed	f	Senthil	\N	\N	t	2026-03-12 17:38:05.664651	2026-03-12 17:38:05.664651
455	65	5	completed	f	Demo User	\N	\N	t	2026-03-12 17:38:05.664651	2026-03-12 17:38:05.664651
456	65	6	completed	f	John Doe	\N	\N	t	2026-03-12 17:38:05.664651	2026-03-12 17:38:05.664651
457	65	7	ongoing	f	Senthil	\N	\N	t	2026-03-12 17:38:05.664651	2026-03-12 17:38:05.664651
458	65	8	booked	f	Test Patient	\N	\N	t	2026-03-12 17:38:05.664651	2026-03-12 17:38:05.664651
459	65	9	booked	f	John Doe	\N	\N	f	2026-03-12 17:38:05.664651	2026-03-12 17:38:05.664651
460	65	10	booked	f	John Doe	\N	\N	f	2026-03-12 17:38:05.664651	2026-03-12 17:38:05.664651
461	65	11	booked	f	Senthil	\N	\N	f	2026-03-12 17:38:05.664651	2026-03-12 17:38:05.664651
462	65	12	booked	f	Demo User	\N	\N	f	2026-03-12 17:38:05.664651	2026-03-12 17:38:05.664651
463	65	13	booked	f	John Doe	\N	\N	f	2026-03-12 17:38:05.664651	2026-03-12 17:38:05.664651
464	65	14	booked	f	Senthil	\N	\N	f	2026-03-12 17:38:05.664651	2026-03-12 17:38:05.664651
465	65	15	booked	f	Test Patient	\N	\N	f	2026-03-12 17:38:05.664651	2026-03-12 17:38:05.664651
466	65	16	booked	f	John Doe	\N	\N	f	2026-03-12 17:38:05.664651	2026-03-12 17:38:05.664651
467	65	17	booked	f	John Doe	\N	\N	f	2026-03-12 17:38:05.664651	2026-03-12 17:38:05.664651
468	65	18	booked	f	Senthil	\N	\N	f	2026-03-12 17:38:05.664651	2026-03-12 17:38:05.664651
469	65	19	booked	f	Demo User	\N	\N	f	2026-03-12 17:38:05.664651	2026-03-12 17:38:05.664651
470	65	20	booked	f	John Doe	\N	\N	f	2026-03-12 17:38:05.664651	2026-03-12 17:38:05.664651
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, phone, role, created_at) FROM stdin;
1	Dr. Ramesh Kumar	dr.ramesh@apollo.com	\N	doctor	2026-03-12 04:41:43.142761
2	Dr. Priya Nair	dr.priya@apollo.com	\N	doctor	2026-03-12 04:41:43.146193
3	Dr. Arjun Singh	dr.arjun@fortis.com	\N	doctor	2026-03-12 04:41:43.149184
4	Dr. Sneha Mehta	dr.sneha@aiims.com	\N	doctor	2026-03-12 04:41:43.152377
5	Dr. Vikram Rao	dr.vikram@manipal.com	\N	doctor	2026-03-12 04:41:43.155629
6	Dr. Lakshmi Devi	dr.lakshmi@apollo.com	\N	doctor	2026-03-12 04:41:43.158575
7	Test Patient	test@patient.com	\N	patient	2026-03-12 04:42:05.804262
8	John Doe	demo@patient.com	\N	patient	2026-03-12 04:42:06.822061
9	John Doe	sn472390_bme26@mepcoeng.ac.in	\N	patient	2026-03-12 04:42:30.982567
10	Senthil	\N	9940774524	patient	2026-03-12 04:43:08.532956
11	Demo User	test@demo.com	\N	patient	2026-03-12 04:46:57.017204
12	John Doe	\N	demo@patient.com	patient	2026-03-12 07:16:49.894001
13	Dr. Test Doctor	\N	9876543210	doctor	2026-03-12 16:46:04.984847
46	Dr. E2E Test	\N	9000000001	doctor	2026-03-12 16:52:25.230613
47	Dr.Kaliraj	\N	9840774524	doctor	2026-03-12 17:00:52.319442
48	Senthil	senthil@patient.com	\N	patient	2026-03-12 17:35:52.594208
\.


--
-- Name: bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bookings_id_seq', 5, true);


--
-- Name: doctors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctors_id_seq', 41, true);


--
-- Name: hospitals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hospitals_id_seq', 39, true);


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sessions_id_seq', 65, true);


--
-- Name: tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tokens_id_seq', 470, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 48, true);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: doctors doctors_login_code_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_login_code_unique UNIQUE (login_code);


--
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);


--
-- Name: hospitals hospitals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitals
    ADD CONSTRAINT hospitals_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: tokens tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_patient_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_patient_id_users_id_fk FOREIGN KEY (patient_id) REFERENCES public.users(id);


--
-- Name: bookings bookings_session_id_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_session_id_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.sessions(id);


--
-- Name: doctors doctors_hospital_id_hospitals_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_hospital_id_hospitals_id_fk FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id);


--
-- Name: doctors doctors_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: sessions sessions_doctor_id_doctors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_doctor_id_doctors_id_fk FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- Name: tokens tokens_session_id_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_session_id_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.sessions(id);


--
-- PostgreSQL database dump complete
--

\unrestrict Zlq30dfaMcPCc0H4LfGXU6iDohHuZURNyjbLiU9ujfE0VhqwxJMnM33vRZMGk9b


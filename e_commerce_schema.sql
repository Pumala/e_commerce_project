--
-- PostgreSQL database dump
--

-- Dumped from database version 9.6.0
-- Dumped by pg_dump version 9.6.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: auth_token; Type: TABLE; Schema: public; Owner: tmoney
--

CREATE TABLE auth_token (
    token text NOT NULL,
    token_expires timestamp without time zone DEFAULT (now() + '30 days'::interval),
    customer_id integer
);


ALTER TABLE auth_token OWNER TO tmoney;

--
-- Name: customer; Type: TABLE; Schema: public; Owner: tmoney
--

CREATE TABLE customer (
    id integer NOT NULL,
    username text,
    email text,
    password text,
    first_name text,
    last_name text
);


ALTER TABLE customer OWNER TO tmoney;

--
-- Name: customer_id_seq; Type: SEQUENCE; Schema: public; Owner: tmoney
--

CREATE SEQUENCE customer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE customer_id_seq OWNER TO tmoney;

--
-- Name: customer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tmoney
--

ALTER SEQUENCE customer_id_seq OWNED BY customer.id;


--
-- Name: product; Type: TABLE; Schema: public; Owner: tmoney
--

CREATE TABLE product (
    id integer NOT NULL,
    name text,
    price integer,
    description text,
    image_path text
);


ALTER TABLE product OWNER TO tmoney;

--
-- Name: product_id_seq; Type: SEQUENCE; Schema: public; Owner: tmoney
--

CREATE SEQUENCE product_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE product_id_seq OWNER TO tmoney;

--
-- Name: product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tmoney
--

ALTER SEQUENCE product_id_seq OWNED BY product.id;


--
-- Name: product_in_purchase; Type: TABLE; Schema: public; Owner: tmoney
--

CREATE TABLE product_in_purchase (
    id integer NOT NULL,
    product_id integer,
    purchase_id integer
);


ALTER TABLE product_in_purchase OWNER TO tmoney;

--
-- Name: product_in_purchase_id_seq; Type: SEQUENCE; Schema: public; Owner: tmoney
--

CREATE SEQUENCE product_in_purchase_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE product_in_purchase_id_seq OWNER TO tmoney;

--
-- Name: product_in_purchase_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tmoney
--

ALTER SEQUENCE product_in_purchase_id_seq OWNED BY product_in_purchase.id;


--
-- Name: product_in_shopping_cart; Type: TABLE; Schema: public; Owner: tmoney
--

CREATE TABLE product_in_shopping_cart (
    id integer NOT NULL,
    product_id integer,
    customer_id integer
);


ALTER TABLE product_in_shopping_cart OWNER TO tmoney;

--
-- Name: product_in_shopping_cart_id_seq; Type: SEQUENCE; Schema: public; Owner: tmoney
--

CREATE SEQUENCE product_in_shopping_cart_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE product_in_shopping_cart_id_seq OWNER TO tmoney;

--
-- Name: product_in_shopping_cart_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tmoney
--

ALTER SEQUENCE product_in_shopping_cart_id_seq OWNED BY product_in_shopping_cart.id;


--
-- Name: purchase; Type: TABLE; Schema: public; Owner: tmoney
--

CREATE TABLE purchase (
    id integer NOT NULL,
    customer_id integer,
    total_price integer,
    address text,
    address_line_2 text,
    city text,
    state text,
    zip_code text
);


ALTER TABLE purchase OWNER TO tmoney;

--
-- Name: purchase_id_seq; Type: SEQUENCE; Schema: public; Owner: tmoney
--

CREATE SEQUENCE purchase_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE purchase_id_seq OWNER TO tmoney;

--
-- Name: purchase_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tmoney
--

ALTER SEQUENCE purchase_id_seq OWNED BY purchase.id;


--
-- Name: customer id; Type: DEFAULT; Schema: public; Owner: tmoney
--

ALTER TABLE ONLY customer ALTER COLUMN id SET DEFAULT nextval('customer_id_seq'::regclass);


--
-- Name: product id; Type: DEFAULT; Schema: public; Owner: tmoney
--

ALTER TABLE ONLY product ALTER COLUMN id SET DEFAULT nextval('product_id_seq'::regclass);


--
-- Name: product_in_purchase id; Type: DEFAULT; Schema: public; Owner: tmoney
--

ALTER TABLE ONLY product_in_purchase ALTER COLUMN id SET DEFAULT nextval('product_in_purchase_id_seq'::regclass);


--
-- Name: product_in_shopping_cart id; Type: DEFAULT; Schema: public; Owner: tmoney
--

ALTER TABLE ONLY product_in_shopping_cart ALTER COLUMN id SET DEFAULT nextval('product_in_shopping_cart_id_seq'::regclass);


--
-- Name: purchase id; Type: DEFAULT; Schema: public; Owner: tmoney
--

ALTER TABLE ONLY purchase ALTER COLUMN id SET DEFAULT nextval('purchase_id_seq'::regclass);


--
-- Name: auth_token auth_token_pkey; Type: CONSTRAINT; Schema: public; Owner: tmoney
--

ALTER TABLE ONLY auth_token
    ADD CONSTRAINT auth_token_pkey PRIMARY KEY (token);


--
-- Name: customer customer_email_key; Type: CONSTRAINT; Schema: public; Owner: tmoney
--

ALTER TABLE ONLY customer
    ADD CONSTRAINT customer_email_key UNIQUE (email);


--
-- Name: customer customer_pkey; Type: CONSTRAINT; Schema: public; Owner: tmoney
--

ALTER TABLE ONLY customer
    ADD CONSTRAINT customer_pkey PRIMARY KEY (id);


--
-- Name: customer customer_username_key; Type: CONSTRAINT; Schema: public; Owner: tmoney
--

ALTER TABLE ONLY customer
    ADD CONSTRAINT customer_username_key UNIQUE (username);


--
-- Name: product_in_purchase product_in_purchase_pkey; Type: CONSTRAINT; Schema: public; Owner: tmoney
--

ALTER TABLE ONLY product_in_purchase
    ADD CONSTRAINT product_in_purchase_pkey PRIMARY KEY (id);


--
-- Name: product_in_shopping_cart product_in_shopping_cart_pkey; Type: CONSTRAINT; Schema: public; Owner: tmoney
--

ALTER TABLE ONLY product_in_shopping_cart
    ADD CONSTRAINT product_in_shopping_cart_pkey PRIMARY KEY (id);


--
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: tmoney
--

ALTER TABLE ONLY product
    ADD CONSTRAINT product_pkey PRIMARY KEY (id);


--
-- Name: purchase purchase_pkey; Type: CONSTRAINT; Schema: public; Owner: tmoney
--

ALTER TABLE ONLY purchase
    ADD CONSTRAINT purchase_pkey PRIMARY KEY (id);


--
-- Name: purchase purchase_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tmoney
--

ALTER TABLE ONLY purchase
    ADD CONSTRAINT purchase_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customer(id);


--
-- PostgreSQL database dump complete
--


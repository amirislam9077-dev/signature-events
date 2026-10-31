-- Booking: menu (dishes) + services — ek dafa chalayein (npm run db:setup bhi isay chalata hai)

-- Pakwan aur services ki list (admin panel → "Menu & Services" se badal sakte hain)
CREATE TABLE IF NOT EXISTS catalog_items (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kind        ENUM('dish','service') NOT NULL,
  category    VARCHAR(60)   NOT NULL,
  name        VARCHAR(120)  NOT NULL,
  unit        ENUM('per_head','fixed','kg','piece') NOT NULL DEFAULT 'per_head',
  price       DECIMAL(12,2) NOT NULL DEFAULT 0,
  active      TINYINT(1)    NOT NULL DEFAULT 1,
  UNIQUE KEY uq_catalog (kind, name)
) ENGINE=InnoDB;

-- Har booked order mein kya kya shamil hai
CREATE TABLE IF NOT EXISTS booking_items (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  enquiry_id  INT UNSIGNED  NOT NULL,
  kind        ENUM('dish','service') NOT NULL,
  category    VARCHAR(60)   NULL,
  name        VARCHAR(120)  NOT NULL,
  qty         DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit        ENUM('per_head','fixed','kg','piece') NOT NULL DEFAULT 'per_head',
  price       DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes       VARCHAR(255)  NULL,
  sort        INT           NOT NULL DEFAULT 0,
  INDEX idx_booking_enquiry (enquiry_id),
  CONSTRAINT fk_booking_enquiry FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Pakistani shaadi / events ke aam pakwan (qeemat 0 — admin panel mein apni rates likhein)
INSERT IGNORE INTO catalog_items (kind, category, name, unit) VALUES
('dish','Starters & Soups','Chicken Corn Soup','per_head'),
('dish','Starters & Soups','Hot & Sour Soup','per_head'),
('dish','Starters & Soups','Fish Crackers','per_head'),
('dish','Starters & Soups','Chaat / Gol Gappay Stall','fixed'),
('dish','BBQ','Chicken Tikka','per_head'),
('dish','BBQ','Seekh Kabab','per_head'),
('dish','BBQ','Malai Boti','per_head'),
('dish','BBQ','Reshmi Kabab','per_head'),
('dish','BBQ','Chapli Kabab','per_head'),
('dish','BBQ','Fish Tikka','per_head'),
('dish','BBQ','Live BBQ Counter','fixed'),
('dish','Main Course','Chicken Karahi','per_head'),
('dish','Main Course','Mutton Karahi','per_head'),
('dish','Main Course','Chicken Qorma','per_head'),
('dish','Main Course','Mutton Qorma','per_head'),
('dish','Main Course','Beef Nihari','per_head'),
('dish','Main Course','Haleem','per_head'),
('dish','Main Course','Chicken Jalfrezi','per_head'),
('dish','Main Course','Daal Mash','per_head'),
('dish','Rice','Chicken Biryani','per_head'),
('dish','Rice','Mutton Biryani','per_head'),
('dish','Rice','Beef Pulao','per_head'),
('dish','Rice','Mutton Pulao','per_head'),
('dish','Rice','Kabuli Pulao','per_head'),
('dish','Rice','Zarda','per_head'),
('dish','Chinese','Chicken Manchurian','per_head'),
('dish','Chinese','Egg Fried Rice','per_head'),
('dish','Chinese','Chicken Chowmein','per_head'),
('dish','Breads','Naan','per_head'),
('dish','Breads','Roghni Naan','per_head'),
('dish','Breads','Taftan','per_head'),
('dish','Breads','Kulcha','per_head'),
('dish','Salads & Raita','Green Salad','per_head'),
('dish','Salads & Raita','Russian Salad','per_head'),
('dish','Salads & Raita','Raita','per_head'),
('dish','Desserts','Kheer','per_head'),
('dish','Desserts','Firni','per_head'),
('dish','Desserts','Gajar ka Halwa','per_head'),
('dish','Desserts','Gulab Jamun','per_head'),
('dish','Desserts','Shahi Tukray','per_head'),
('dish','Desserts','Fruit Trifle','per_head'),
('dish','Desserts','Ice Cream','per_head'),
('dish','Drinks','Cold Drinks','per_head'),
('dish','Drinks','Mineral Water','per_head'),
('dish','Drinks','Kashmiri Chai','per_head'),
('dish','Drinks','Green Tea / Kahwa','per_head'),
('service','Decor','Stage Decoration','fixed'),
('service','Decor','Floral Entrance','fixed'),
('service','Decor','Table Centerpieces','piece'),
('service','Decor','Car Decoration','fixed'),
('service','Lighting & Sound','Lighting','fixed'),
('service','Lighting & Sound','Sound System & DJ','fixed'),
('service','Lighting & Sound','Dhol','fixed'),
('service','Photo & Video','Photography','fixed'),
('service','Photo & Video','Videography','fixed'),
('service','Photo & Video','Drone Coverage','fixed'),
('service','Beauty','Bridal Makeup','fixed'),
('service','Beauty','Mehndi Artist','fixed'),
('service','Staff & Setup','Waiters / Service Staff','piece'),
('service','Staff & Setup','Crockery & Cutlery','per_head'),
('service','Staff & Setup','Marquee / Tent','fixed'),
('service','Staff & Setup','Chairs & Tables','per_head'),
('service','Staff & Setup','Generator','fixed'),
('service','Other','Invitation Cards','piece'),
('service','Other','Event Coordinator','fixed');

-- ===== Venues (halls) bhi isi list mein: category = area, price = hall ka kiraya =====
ALTER TABLE catalog_items MODIFY kind ENUM('dish','service','venue') NOT NULL;

-- DUMMY Karachi halls — apne asli halls se badal dein
INSERT IGNORE INTO catalog_items (kind, category, name, unit, price) VALUES
('venue','DHA Phase 6','Royal Palace Banquet','fixed',450000),
('venue','Clifton','Grand Marquee Clifton','fixed',400000),
('venue','Sea View, Clifton','Sea Breeze Lawn','fixed',380000),
('venue','Shahrah-e-Faisal','Signature Lawn','fixed',350000),
('venue','PECHS','Moonlight Banquet','fixed',300000),
('venue','Bahadurabad','Al-Noor Banquet Hall','fixed',250000),
('venue','Gulshan-e-Iqbal','Emerald Banquet Hall','fixed',280000),
('venue','Gulistan-e-Jauhar','Crystal Marquee','fixed',220000),
('venue','North Nazimabad','Shalimar Lawn','fixed',240000),
('venue','Malir Cantt','Golden Pavilion Marquee','fixed',260000),
('venue','Bahria Town Karachi','Palm Grove Hall','fixed',320000),
('venue','Korangi','City Star Banquet','fixed',180000);

-- DUMMY rates (Rs) — sirf jahan qeemat abhi 0 hai; asli rates admin panel mein likhein
UPDATE catalog_items SET price = CASE name
  WHEN 'Chicken Corn Soup' THEN 180 WHEN 'Hot & Sour Soup' THEN 200 WHEN 'Fish Crackers' THEN 50
  WHEN 'Chaat / Gol Gappay Stall' THEN 20000
  WHEN 'Chicken Tikka' THEN 350 WHEN 'Seekh Kabab' THEN 300 WHEN 'Malai Boti' THEN 400 WHEN 'Reshmi Kabab' THEN 350
  WHEN 'Chapli Kabab' THEN 300 WHEN 'Fish Tikka' THEN 450 WHEN 'Live BBQ Counter' THEN 25000
  WHEN 'Chicken Karahi' THEN 450 WHEN 'Mutton Karahi' THEN 900 WHEN 'Chicken Qorma' THEN 400 WHEN 'Mutton Qorma' THEN 850
  WHEN 'Beef Nihari' THEN 450 WHEN 'Haleem' THEN 300 WHEN 'Chicken Jalfrezi' THEN 400 WHEN 'Daal Mash' THEN 200
  WHEN 'Chicken Biryani' THEN 400 WHEN 'Mutton Biryani' THEN 750 WHEN 'Beef Pulao' THEN 450 WHEN 'Mutton Pulao' THEN 750
  WHEN 'Kabuli Pulao' THEN 700 WHEN 'Zarda' THEN 150
  WHEN 'Chicken Manchurian' THEN 400 WHEN 'Egg Fried Rice' THEN 250 WHEN 'Chicken Chowmein' THEN 300
  WHEN 'Naan' THEN 40 WHEN 'Roghni Naan' THEN 60 WHEN 'Taftan' THEN 70 WHEN 'Kulcha' THEN 50
  WHEN 'Green Salad' THEN 60 WHEN 'Russian Salad' THEN 120 WHEN 'Raita' THEN 50
  WHEN 'Kheer' THEN 150 WHEN 'Firni' THEN 150 WHEN 'Gajar ka Halwa' THEN 250 WHEN 'Gulab Jamun' THEN 120
  WHEN 'Shahi Tukray' THEN 200 WHEN 'Fruit Trifle' THEN 180 WHEN 'Ice Cream' THEN 150
  WHEN 'Cold Drinks' THEN 120 WHEN 'Mineral Water' THEN 60 WHEN 'Kashmiri Chai' THEN 150 WHEN 'Green Tea / Kahwa' THEN 80
  WHEN 'Stage Decoration' THEN 150000 WHEN 'Floral Entrance' THEN 60000 WHEN 'Table Centerpieces' THEN 3500
  WHEN 'Car Decoration' THEN 25000 WHEN 'Lighting' THEN 80000 WHEN 'Sound System & DJ' THEN 60000 WHEN 'Dhol' THEN 20000
  WHEN 'Photography' THEN 120000 WHEN 'Videography' THEN 150000 WHEN 'Drone Coverage' THEN 40000
  WHEN 'Bridal Makeup' THEN 80000 WHEN 'Mehndi Artist' THEN 15000 WHEN 'Waiters / Service Staff' THEN 3000
  WHEN 'Crockery & Cutlery' THEN 150 WHEN 'Marquee / Tent' THEN 200000 WHEN 'Chairs & Tables' THEN 250
  WHEN 'Generator' THEN 35000 WHEN 'Invitation Cards' THEN 250 WHEN 'Event Coordinator' THEN 50000
  ELSE price END
WHERE price = 0 AND kind IN ('dish','service');

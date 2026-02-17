-- BrainBolt Database Schema
-- PostgreSQL initialization script with tables, indexes, and seed data

-- ============================================
-- TABLES
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY,
    text TEXT NOT NULL,
    options TEXT[] NOT NULL,
    correct_index INTEGER NOT NULL,
    difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 10),
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User state table
CREATE TABLE IF NOT EXISTS user_state (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    difficulty INTEGER DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 10),
    confidence NUMERIC(5,2) DEFAULT 0 CHECK (confidence >= -5 AND confidence <= 5),
    multiplier NUMERIC(5,2) DEFAULT 1,
    current_question_id UUID,
    state_version INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answer log table
CREATE TABLE IF NOT EXISTS answer_log (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_index INTEGER NOT NULL,
    correct BOOLEAN NOT NULL,
    score_delta INTEGER NOT NULL,
    difficulty INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- User state indexes
CREATE INDEX IF NOT EXISTS idx_user_state_user_id ON user_state(user_id);
CREATE INDEX IF NOT EXISTS idx_user_state_score ON user_state(score DESC);
CREATE INDEX IF NOT EXISTS idx_user_state_max_streak ON user_state(max_streak DESC);

-- Answer log indexes
CREATE INDEX IF NOT EXISTS idx_answer_log_user_id ON answer_log(user_id);
CREATE INDEX IF NOT EXISTS idx_answer_log_created_at ON answer_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answer_log_user_created ON answer_log(user_id, created_at DESC);

-- Question indexes
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);

-- Leaderboard views
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_score AS
SELECT 
    us.user_id,
    u.username,
    us.score as total_score
FROM user_state us
JOIN users u ON u.id = us.user_id
ORDER BY us.score DESC;

CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_streak AS
SELECT 
    us.user_id,
    u.username,
    us.max_streak
FROM user_state us
JOIN users u ON u.id = us.user_id
ORDER BY us.max_streak DESC;

-- ============================================
-- SEED DATA: 200 QUESTIONS
-- ============================================

-- Questions will be seeded programmatically via the API
-- This script just creates the base schema

-- Insert seed questions (200 total - 20 per difficulty level)
INSERT INTO questions (id, text, options, correct_index, difficulty, category) VALUES
-- Difficulty 1 (Very Easy) - Questions 1-20
('11111111-1111-1111-1111-111111111101', 'What is 2 + 3?', ARRAY['3', '4', '5', '6'], 2, 1, 'Math'),
('11111111-1111-1111-1111-111111111102', 'What is 10 - 4?', ARRAY['4', '5', '6', '7'], 2, 1, 'Math'),
('11111111-1111-1111-1111-111111111103', 'What is 5 × 2?', ARRAY['8', '10', '12', '15'], 1, 1, 'Math'),
('11111111-1111-1111-1111-111111111104', 'What is 20 ÷ 4?', ARRAY['4', '5', '6', '7'], 1, 1, 'Math'),
('11111111-1111-1111-1111-111111111105', 'What is 1 + 1?', ARRAY['1', '2', '3', '4'], 1, 1, 'Math'),
('11111111-1111-1111-1111-111111111106', 'What is 7 - 3?', ARRAY['2', '3', '4', '5'], 2, 1, 'Math'),
('11111111-1111-1111-1111-111111111107', 'What is 3 × 3?', ARRAY['6', '8', '9', '12'], 2, 1, 'Math'),
('11111111-1111-1111-1111-111111111108', 'What is 15 ÷ 3?', ARRAY['3', '4', '5', '6'], 2, 1, 'Math'),
('11111111-1111-1111-1111-111111111109', 'What is the capital of France?', ARRAY['London', 'Berlin', 'Paris', 'Rome'], 2, 1, 'Geography'),
('11111111-1111-1111-1111-111111111110', 'What color is the sky?', ARRAY['Blue', 'Green', 'Red', 'Yellow'], 0, 1, 'Science'),
('11111111-1111-1111-1111-111111111111', 'How many legs does a cat have?', ARRAY['2', '4', '6', '8'], 1, 1, 'Science'),
('11111111-1111-1111-1111-111111111112', 'What is the largest ocean?', ARRAY['Atlantic', 'Indian', 'Pacific', 'Arctic'], 2, 1, 'Geography'),
('11111111-1111-1111-1111-111111111113', 'What do plants need to grow?', ARRAY['Chocolate', 'Sunlight', 'Rocks', 'Plastic'], 1, 1, 'Science'),
('11111111-1111-1111-1111-111111111114', 'What is the fastest land animal?', ARRAY['Lion', 'Cheetah', 'Horse', 'Tiger'], 1, 1, 'Science'),
('11111111-1111-1111-1111-111111111115', 'What is 6 + 2?', ARRAY['6', '7', '8', '9'], 2, 1, 'Math'),
('11111111-1111-1111-1111-111111111116', 'What is 9 - 5?', ARRAY['2', '3', '4', '5'], 2, 1, 'Math'),
('11111111-1111-1111-1111-111111111117', 'What is 4 × 4?', ARRAY['8', '12', '16', '20'], 2, 1, 'Math'),
('11111111-1111-1111-1111-111111111118', 'What is 25 ÷ 5?', ARRAY['3', '4', '5', '6'], 2, 1, 'Math'),
('11111111-1111-1111-1111-111111111119', 'What is the largest continent?', ARRAY['Africa', 'Antarctica', 'Asia', 'Europe'], 2, 1, 'Geography'),
('11111111-1111-1111-1111-111111111120', 'What freezes at 0 degrees?', ARRAY['Water', 'Gold', 'Iron', 'Fire'], 0, 1, 'Science'),

-- Difficulty 2 (Easy) - Questions 21-40
('22222222-2222-2222-2222-222222222201', 'What is 15 + 27?', ARRAY['40', '42', '44', '46'], 1, 2, 'Math'),
('22222222-2222-2222-2222-222222222202', 'What is 100 - 45?', ARRAY['50', '55', '60', '65'], 1, 2, 'Math'),
('22222222-2222-2222-2222-222222222203', 'What is 12 × 5?', ARRAY['50', '55', '60', '65'], 2, 2, 'Math'),
('22222222-2222-2222-2222-222222222204', 'What is 144 ÷ 12?', ARRAY['10', '11', '12', '13'], 2, 2, 'Math'),
('22222222-2222-2222-2222-222222222205', 'What is 7²?', ARRAY['14', '21', '49', '56'], 2, 2, 'Math'),
('22222222-2222-2222-2222-222222222206', 'What is √16?', ARRAY['2', '3', '4', '5'], 2, 2, 'Math'),
('22222222-2222-2222-2222-222222222207', 'What is 3 + 4 + 5?', ARRAY['10', '11', '12', '13'], 2, 2, 'Math'),
('22222222-2222-2222-2222-222222222208', 'What is 50 - (3 × 5)?', ARRAY['30', '35', '40', '45'], 1, 2, 'Math'),
('22222222-2222-2222-2222-222222222209', 'What is the capital of Japan?', ARRAY['Seoul', 'Beijing', 'Tokyo', 'Bangkok'], 2, 2, 'Geography'),
('22222222-2222-2222-2222-222222222210', 'What planet is known as the Red Planet?', ARRAY['Venus', 'Mars', 'Jupiter', 'Saturn'], 1, 2, 'Science'),
('22222222-2222-2222-2222-222222222211', 'What is H2O?', ARRAY['Salt', 'Water', 'Oxygen', 'Carbon'], 1, 2, 'Science'),
('22222222-2222-2222-2222-222222222212', 'What is the largest mammal?', ARRAY['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'], 1, 2, 'Science'),
('22222222-2222-2222-2222-222222222213', 'What country has the most people?', ARRAY['USA', 'India', 'China', 'Indonesia'], 2, 2, 'Geography'),
('22222222-2222-2222-2222-222222222214', 'What gas do plants absorb?', ARRAY['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], 2, 2, 'Science'),
('22222222-2222-2222-2222-222222222215', 'What is 25 + 38?', ARRAY['53', '60', '63', '65'], 2, 2, 'Math'),
('22222222-2222-2222-2222-222222222216', 'What is 200 - 87?', ARRAY['110', '113', '115', '117'], 1, 2, 'Math'),
('22222222-2222-2222-2222-222222222217', 'What is 15 × 6?', ARRAY['80', '90', '100', '110'], 1, 2, 'Math'),
('22222222-2222-2222-2222-222222222218', 'What is 180 ÷ 15?', ARRAY['10', '11', '12', '13'], 2, 2, 'Math'),
('22222222-2222-2222-2222-222222222219', 'What is the smallest continent?', ARRAY['Europe', 'Antarctica', 'Australia', 'South America'], 2, 2, 'Geography'),
('22222222-2222-2222-2222-222222222220', 'What is the center of the Earth?', ARRAY['Magma', 'Iron', 'Gold', 'Diamond'], 0, 2, 'Science'),

-- Difficulty 3 (Medium-Easy) - Questions 41-60
('33333333-3333-3333-3333-333333333301', 'What is 123 + 456?', ARRAY['567', '579', '589', '599'], 1, 3, 'Math'),
('33333333-3333-3333-3333-333333333302', 'What is 1000 - 234?', ARRAY['766', '776', '786', '796'], 0, 3, 'Math'),
('33333333-3333-3333-3333-333333333303', 'What is 25 × 12?', ARRAY['250', '275', '300', '325'], 2, 3, 'Math'),
('33333333-3333-3333-3333-333333333304', 'What is 1001 ÷ 7?', ARRAY['133', '143', '153', '163'], 1, 3, 'Math'),
('33333333-3333-3333-3333-333333333305', 'What is 8³?', ARRAY['64', '256', '512', '1024'], 2, 3, 'Math'),
('33333333-3333-3333-3333-333333333306', 'What is √81?', ARRAY['7', '8', '9', '10'], 2, 3, 'Math'),
('33333333-3333-3333-3333-333333333307', 'Solve: 3x = 12', ARRAY['2', '3', '4', '5'], 2, 3, 'Math'),
('33333333-3333-3333-3333-333333333308', 'What is 15% of 200?', ARRAY['20', '25', '30', '35'], 2, 3, 'Math'),
('33333333-3333-3333-3333-333333333309', 'What is the largest country by area?', ARRAY['China', 'USA', 'Canada', 'Russia'], 3, 3, 'Geography'),
('33333333-3333-3333-3333-333333333310', 'What is the speed of light?', ARRAY['300,000 km/s', '150,000 km/s', '500,000 km/s', '1,000,000 km/s'], 0, 3, 'Science'),
('33333333-3333-3333-3333-333333333311', 'What is the chemical symbol for Gold?', ARRAY['Go', 'Gd', 'Au', 'Ag'], 2, 3, 'Science'),
('33333333-3333-3333-3333-333333333312', 'How many bones in the adult human body?', ARRAY['106', '206', '306', '406'], 1, 3, 'Science'),
('33333333-3333-3333-3333-333333333313', 'What is the longest river?', ARRAY['Amazon', 'Nile', 'Mississippi', 'Yangtze'], 1, 3, 'Geography'),
('33333333-3333-3333-3333-333333333314', 'What planet has the most moons?', ARRAY['Jupiter', 'Saturn', 'Uranus', 'Neptune'], 1, 3, 'Science'),
('33333333-3333-3333-3333-333333333315', 'What is 456 + 789?', ARRAY['1234', '1245', '1256', '1267'], 1, 3, 'Math'),
('33333333-3333-3333-3333-333333333316', 'What is 5000 - 1234?', ARRAY['3766', '3866', '3966', '4066'], 0, 3, 'Math'),
('33333333-3333-3333-3333-333333333317', 'What is 45 × 22?', ARRAY['880', '990', '1100', '1210'], 1, 3, 'Math'),
('33333333-3333-3333-3333-333333333318', 'What is 2500 ÷ 25?', ARRAY['90', '100', '110', '120'], 1, 3, 'Math'),
('33333333-3333-3333-3333-333333333319', 'What is the tallest mountain?', ARRAY['K2', 'Kangchenjunga', 'Mount Everest', 'Lhotse'], 2, 3, 'Geography'),
('33333333-3333-3333-3333-333333333320', 'What is the powerhouse of the cell?', ARRAY['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi body'], 2, 3, 'Science'),

-- Difficulty 4 (Medium) - Questions 61-80
('44444444-4444-4444-4444-444444444401', 'What is 7 × 8 + 3?', ARRAY['54', '56', '59', '61'], 2, 4, 'Math'),
('44444444-4444-4444-4444-444444444402', 'Solve: 2x + 5 = 15', ARRAY['3', '4', '5', '6'], 2, 4, 'Math'),
('44444444-4444-4444-4444-444444444403', 'What is 20% of 350?', ARRAY['60', '70', '80', '90'], 1, 4, 'Math'),
('44444444-4444-4444-4444-444444444404', 'What is the square root of 144?', ARRAY['10', '11', '12', '13'], 2, 4, 'Math'),
('44444444-4444-4444-4444-444444444405', 'What is 5³?', ARRAY['15', '25', '125', '625'], 2, 4, 'Math'),
('44444444-4444-4444-4444-444444444406', 'What is 3 + 5 × 2?', ARRAY['10', '13', '16', '20'], 1, 4, 'Math'),
('44444444-4444-4444-4444-444444444407', 'Solve: x/4 = 7', ARRAY['21', '24', '28', '32'], 2, 4, 'Math'),
('44444444-4444-4444-4444-444444444408', 'What is 0.25 as a fraction?', ARRAY['1/2', '1/3', '1/4', '1/5'], 2, 4, 'Math'),
('44444444-4444-4444-4444-444444444409', 'What is the capital of Australia?', ARRAY['Sydney', 'Melbourne', 'Canberra', 'Perth'], 2, 4, 'Geography'),
('44444444-4444-4444-4444-444444444410', 'What is the atomic number of Carbon?', ARRAY['4', '6', '8', '12'], 1, 4, 'Science'),
('44444444-4444-4444-4444-444444444411', 'What is Newton''s first law about?', ARRAY['Gravity', 'Inertia', 'Action/Reaction', 'Energy'], 1, 4, 'Science'),
('44444444-4444-4444-4444-444444444412', 'What is the hardest natural substance?', ARRAY['Gold', 'Iron', 'Diamond', 'Platinum'], 2, 4, 'Science'),
('44444444-4444-4444-4444-444444444413', 'How many chromosomes do humans have?', ARRAY['23', '44', '46', '48'], 2, 4, 'Science'),
('44444444-4444-4444-4444-444444444414', 'What is the driest desert?', ARRAY['Sahara', 'Gobi', 'Atacama', 'Antarctic'], 2, 4, 'Geography'),
('44444444-4444-4444-4444-444444444415', 'What is 156 + 287?', ARRAY['433', '443', '453', '463'], 1, 4, 'Math'),
('44444444-4444-4444-4444-444444444416', 'Solve: 3x - 4 = 11', ARRAY['4', '5', '6', '7'], 1, 4, 'Math'),
('44444444-4444-4444-4444-444444444417', 'What is 15% of 450?', ARRAY['60', '65', '67.5', '70'], 2, 4, 'Math'),
('44444444-4444-4444-4444-444444444418', 'What is the square of 17?', ARRAY['269', '279', '289', '299'], 2, 4, 'Math'),
('44444444-4444-4444-4444-444444444419', 'What country has the most natural lakes?', ARRAY['USA', 'Russia', 'Canada', 'Brazil'], 2, 4, 'Geography'),
('44444444-4444-4444-4444-444444444420', 'What is the study of earthquakes called?', ARRAY['Meteorology', 'Geology', 'Seismology', 'Volcanology'], 2, 4, 'Science'),

-- Difficulty 5 (Medium-Hard) - Questions 81-100
('55555555-5555-5555-5555-555555555501', 'What is √(169)?', ARRAY['11', '12', '13', '14'], 2, 5, 'Math'),
('55555555-5555-5555-5555-555555555502', 'Solve: 4x + 8 = 20', ARRAY['2', '3', '4', '5'], 1, 5, 'Math'),
('55555555-5555-5555-5555-555555555503', 'What is 30% of 250?', ARRAY['65', '70', '75', '80'], 2, 5, 'Math'),
('55555555-5555-5555-5555-555555555504', 'What is 2⁴?', ARRAY['8', '16', '32', '64'], 1, 5, 'Math'),
('55555555-5555-5555-5555-555555555505', 'What is 144 ÷ (3 × 4)?', ARRAY['10', '11', '12', '13'], 2, 5, 'Math'),
('55555555-5555-5555-5555-555555555506', 'What is 5 × 7 + 12?', ARRAY['35', '40', '47', '55'], 2, 5, 'Math'),
('55555555-5555-5555-5555-555555555507', 'Solve: (x-3)/2 = 4', ARRAY['9', '10', '11', '12'], 2, 5, 'Math'),
('55555555-5555-5555-5555-555555555508', 'What is 2/3 as a decimal?', ARRAY['0.5', '0.66', '0.75', '0.8'], 1, 5, 'Math'),
('55555555-5555-5555-5555-555555555509', 'What is the capital of Brazil?', ARRAY['Rio de Janeiro', 'São Paulo', 'Brasília', 'Salvador'], 2, 5, 'Geography'),
('55555555-5555-5555-5555-555555555510', 'What is the chemical formula for table salt?', ARRAY['NaCl', 'KCl', 'CaCl2', 'MgCl2'], 0, 5, 'Science'),
('55555555-5555-5555-5555-555555555511', 'What is acceleration measured in?', ARRAY['m/s', 'm/s²', 'kg·m/s', 'J'], 1, 5, 'Science'),
('55555555-5555-5555-5555-555555555512', 'What is the closest star to Earth?', ARRAY['Proxima Centauri', 'Sirius', 'Alpha Centauri A', 'The Sun'], 3, 5, 'Science'),
('55555555-5555-5555-5555-555555555513', 'What is the largest island?', ARRAY['Borneo', 'Greenland', 'Madagascar', 'New Guinea'], 1, 5, 'Geography'),
('55555555-5555-5555-5555-555555555514', 'What is the pH of pure water?', ARRAY['0', '7', '14', '1'], 1, 5, 'Science'),
('55555555-5555-5555-5555-555555555515', 'What is 1000 × 0.75?', ARRAY['700', '720', '750', '800'], 2, 5, 'Math'),
('55555555-5555-5555-5555-555555555516', 'Solve: 5x - 7 = 18', ARRAY['4', '5', '6', '7'], 1, 5, 'Math'),
('55555555-5555-5555-5555-555555555517', 'What is 40% of 180?', ARRAY['68', '70', '72', '75'], 2, 5, 'Math'),
('55555555-5555-5555-5555-555555555518', 'What is 11²?', ARRAY['111', '121', '131', '141'], 1, 5, 'Math'),
('55555555-5555-5555-5555-555555555519', 'What is the deepest ocean trench?', ARRAY['Puerto Rico', 'Mariana', 'Java', 'Philippine'], 1, 5, 'Geography'),
('55555555-5555-5555-5555-555555555520', 'What type of rock is limestone?', ARRAY['Igneous', 'Sedimentary', 'Metamorphic', 'Volcanic'], 1, 5, 'Science'),

-- Difficulty 6 (Hard) - Questions 101-120
('66666666-6666-6666-6666-666666666601', 'Solve: 3x + 2y = 12, x = 2', ARRAY['y = 3', 'y = 4', 'y = 5', 'y = 6'], 0, 6, 'Math'),
('66666666-6666-6666-6666-666666666602', 'What is the derivative of x²?', ARRAY['x', '2x', 'x²', '2x²'], 1, 6, 'Math'),
('66666666-6666-6666-6666-666666666603', 'What is log₁₀(100)?', ARRAY['1', '2', '10', '100'], 1, 6, 'Math'),
('66666666-6666-6666-6666-666666666604', 'What is sin(90°)?', ARRAY['0', '1', '√2/2', '√3/2'], 1, 6, 'Math'),
('66666666-6666-6666-6666-666666666605', 'Solve: x² = 49', ARRAY['±6', '±7', '±8', '±9'], 1, 6, 'Math'),
('66666666-6666-6666-6666-666666666606', 'What is (3⁴)²?', ARRAY['3⁶', '3⁸', '9⁶', '9⁸'], 1, 6, 'Math'),
('66666666-6666-6666-6666-666666666607', 'What is the integral of 2x?', ARRAY['x²', 'x² + C', '2x²', '2x² + C'], 1, 6, 'Math'),
('66666666-6666-6666-6666-666666666608', 'What is cos(0°)?', ARRAY['-1', '0', '1', '√2/2'], 2, 6, 'Math'),
('66666666-6666-6666-6666-666666666609', 'What is the capital of Germany?', ARRAY['Munich', 'Frankfurt', 'Berlin', 'Hamburg'], 2, 6, 'Geography'),
('66666666-6666-6666-6666-666666666610', 'What is the half-life?', ARRAY['Time for half mass', 'Time for full decay', 'Double the mass', 'Half the atoms'], 0, 6, 'Science'),
('66666666-6666-6666-6666-666666666611', 'What is the powerhouse of the atom?', ARRAY['Proton', 'Electron', 'Neutron', 'Nucleus'], 3, 6, 'Science'),
('66666666-6666-6666-6666-666666666612', 'What is the Planck constant?', ARRAY['6.626 × 10⁻³⁴', '1.602 × 10⁻¹⁹', '8.314', '6.022 × 10²³'], 0, 6, 'Science'),
('66666666-6666-6666-6666-666666666613', 'What is the Doppler effect?', ARRAY['Light bending', 'Sound pitch change', 'Gravity', 'Time dilation'], 1, 6, 'Science'),
('66666666-6666-6666-6666-666666666614', 'What is the largest volcano?', ARRAY['Mount Fuji', 'Mount St. Helens', 'Mauna Loa', 'Mount Everest'], 2, 6, 'Geography'),
('66666666-6666-6666-6666-666666666615', 'Solve: |x - 5| = 3', ARRAY['x = 2', 'x = 8', 'x = 2 or 8', 'x = -2'], 2, 6, 'Math'),
('66666666-6666-6666-6666-666666666616', 'What is the LCM of 12 and 18?', ARRAY['24', '36', '48', '72'], 1, 6, 'Math'),
('66666666-6666-6666-6666-666666666617', 'What is 25% of 640?', ARRAY['140', '150', '160', '170'], 2, 6, 'Math'),
('66666666-6666-6666-6666-666666666618', 'What is 4! ?', ARRAY['4', '12', '24', '48'], 2, 6, 'Math'),
('66666666-6666-6666-6666-666666666619', 'What is the least dense planet?', ARRAY['Earth', 'Mars', 'Saturn', 'Jupiter'], 2, 6, 'Science'),
('66666666-6666-6666-6666-666666666620', 'What is absolute zero?', ARRAY['0°C', '-273°C', '-100°C', '273K'], 1, 6, 'Science'),

-- Difficulty 7 (Hard) - Questions 121-140
('77777777-7777-7777-7777-777777777701', 'Solve: 2x² + 5x - 3 = 0', ARRAY['x = 0.5 or -3', 'x = -0.5 or 3', 'x = 1 or -1.5', 'x = 0.5 or 3'], 0, 7, 'Math'),
('77777777-7777-7777-7777-777777777702', 'What is tan(45°)?', ARRAY['0', '1', '√2', '∞'], 1, 7, 'Math'),
('77777777-7777-7777-7777-777777777703', 'What is e²?', ARRAY['2.718', '5.436', '7.389', '9.874'], 2, 7, 'Math'),
('77777777-7777-7777-7777-777777777704', 'What is the GCD of 48 and 72?', ARRAY['12', '16', '24', '36'], 2, 7, 'Math'),
('77777777-7777-7777-7777-777777777705', 'What is log₂(8)?', ARRAY['2', '3', '4', '8'], 1, 7, 'Math'),
('77777777-7777-7777-7777-777777777706', 'What is the area of a circle with r=3?', ARRAY['6π', '9π', '12π', '18π'], 1, 7, 'Math'),
('77777777-7777-7777-7777-777777777707', 'Solve: x³ = 27', ARRAY['x = 3', 'x = 6', 'x = 9', 'x = 27'], 0, 7, 'Math'),
('77777777-7777-7777-7777-777777777708', 'What is 5⁻²?', ARRAY['-25', '-10', '0.04', '0.25'], 2, 7, 'Math'),
('77777777-7777-7777-7777-777777777709', 'What is the capital of South Korea?', ARRAY['Busan', 'Incheon', 'Seoul', 'Daegu'], 2, 7, 'Geography'),
('77777777-7777-7777-7777-777777777710', 'What is the speed of sound?', ARRAY['343 m/s', '300,000 km/s', '1500 m/s', '10 m/s'], 0, 7, 'Science'),
('77777777-7777-7777-7777-777777777711', 'What is the Schwarzschild radius?', ARRAY['Event horizon', 'Photon sphere', 'Singularity', 'Accretion disk'], 0, 7, 'Science'),
('77777777-7777-7777-7777-777777777712', 'What is the Heisenberg principle?', ARRAY['E = mc²', 'Uncertainty principle', 'Pauli exclusion', 'Bohr model'], 1, 7, 'Science'),
('77777777-7777-7777-7777-777777777713', 'What is the Drake equation?', ARRAY['Orbit formula', 'Life probability', 'Star formula', 'Gravity formula'], 1, 7, 'Science'),
('77777777-7777-7777-7777-777777777714', 'What is the ozone layer?', ARRAY['O₂ layer', 'O₃ layer', 'CO₂ layer', 'N₂ layer'], 1, 7, 'Science'),
('77777777-7777-7777-7777-777777777715', 'Simplify: √50', ARRAY['5√2', '2√5', '25√2', '10√5'], 0, 7, 'Math'),
('77777777-7777-7777-7777-777777777716', 'What is 3⁻¹ + 2⁻¹?', ARRAY['1', '5/6', '6/5', '1/5'], 1, 7, 'Math'),
('77777777-7777-7777-7777-777777777717', 'Solve: |2x - 1| = 7', ARRAY['x = 3 or -4', 'x = 4 or -3', 'x = 3 or -3', 'x = 4 or -4'], 1, 7, 'Math'),
('77777777-7777-7777-7777-777777777718', 'What is the 7th prime?', ARRAY['17', '19', '21', '23'], 0, 7, 'Math'),
('77777777-7777-7777-7777-777777777719', 'What is the lowest frequency color?', ARRAY['Violet', 'Blue', 'Green', 'Red'], 3, 7, 'Science'),
('77777777-7777-7777-7777-777777777720', 'What is PCR used for?', ARRAY['Cloning DNA', 'Cutting DNA', 'Copying RNA', 'Synthesizing proteins'], 0, 7, 'Science'),

-- Difficulty 8 (Very Hard) - Questions 141-160
('88888888-8888-8888-8888-888888888801', 'Solve: x² - 5x + 6 = 0', ARRAY['x = 1, 6', 'x = 2, 3', 'x = -2, -3', 'x = 1, 2'], 1, 8, 'Math'),
('88888888-8888-8888-8888-888888888802', 'What is lim(x→0) sin(x)/x?', ARRAY['0', '1', '∞', 'undefined'], 1, 8, 'Math'),
('88888888-8888-8888-8888-888888888803', 'What is the derivative of sin(x)?', ARRAY['cos(x)', '-cos(x)', 'sin(x)', '-sin(x)'], 0, 8, 'Math'),
('88888888-8888-8888-8888-888888888804', 'What is i²?', ARRAY['-1', '1', 'i', '-i'], 0, 8, 'Math'),
('88888888-8888-8888-8888-888888888805', 'What is log(1)?', ARRAY['0', '1', 'e', '10'], 0, 8, 'Math'),
('88888888-8888-8888-8888-888888888806', 'What is cos(60°)?', ARRAY['0', '1/2', '√2/2', '√3/2'], 1, 8, 'Math'),
('88888888-8888-8888-8888-888888888807', 'Solve: 3x + 7 = 2(x + 5)', ARRAY['x = 2', 'x = 3', 'x = 4', 'x = 5'], 1, 8, 'Math'),
('88888888-8888-8888-8888-888888888808', 'What is the volume of sphere r=1?', ARRAY['4/3π', 'π', '4π', '2π'], 0, 8, 'Math'),
('88888888-8888-8888-8888-888888888809', 'What is the capital of India?', ARRAY['Mumbai', 'Kolkata', 'New Delhi', 'Chennai'], 2, 8, 'Geography'),
('88888888-8888-8888-8888-888888888810', 'What is quantum entanglement?', ARRAY['Particle spin', 'Instantaneous correlation', 'Energy transfer', 'Wave function'], 1, 8, 'Science'),
('88888888-8888-8888-8888-888888888811', 'What is the Chandrasekhar limit?', ARRAY['Star mass limit', 'Planet limit', 'Black hole limit', 'Galaxy limit'], 0, 8, 'Science'),
('88888888-8888-8888-8888-888888888812', 'What is CRISPR used for?', ARRAY['Gene editing', 'Virus detection', 'Protein synthesis', 'Cell division'], 0, 8, 'Science'),
('88888888-8888-8888-8888-888888888813', 'What is dark matter?', ARRAY['Invisible gas', 'Non-baryonic matter', 'Black holes', 'Neutrinos'], 1, 8, 'Science'),
('88888888-8888-8888-8888-888888888814', 'What is the Great Red Spot?', ARRAY['Volcano', 'Storm', 'Ocean', 'Crater'], 1, 8, 'Science'),
('88888888-8888-8888-8888-888888888815', 'What is sin(30°)?', ARRAY['0', '1/2', '√2/2', '√3/2'], 1, 8, 'Math'),
('88888888-8888-8888-8888-888888888816', 'What is tan(0°)?', ARRAY['0', '1', 'undefined', '∞'], 0, 8, 'Math'),
('88888888-8888-8888-8888-888888888817', 'What is 8C2?', ARRAY['16', '28', '56', '64'], 2, 8, 'Math'),
('88888888-8888-8888-8888-888888888818', 'What is the integral of 1/x?', ARRAY['x', 'ln|x| + C', '1/x² + C', 'x² + C'], 1, 8, 'Math'),
('88888888-8888-8888-8888-888888888819', 'What is a pulsar?', ARRAY['Falling star', 'Spinning neutron star', 'Black hole', 'Quasar'], 1, 8, 'Science'),
('88888888-8888-8888-8888-888888888820', 'What is telomerase?', ARRAY['DNA polymerase', 'RNA enzyme', 'Cell clock enzyme', 'Repair protein'], 2, 8, 'Science'),

-- Difficulty 9 (Expert) - Questions 161-180
('99999999-9999-9999-9999-999999999901', 'What is ∫eˣdx?', ARRAY['eˣ + C', 'xeˣ + C', 'eˣ⁺¹ + C', 'eˣ-1 + C'], 0, 9, 'Math'),
('99999999-9999-9999-9999-999999999902', 'What is the derivative of ln(x)?', ARRAY['1/x', 'x', 'ln(x)', 'eˣ'], 0, 9, 'Math'),
('99999999-9999-9999-9999-999999999903', 'Solve: eˣ = 1', ARRAY['x = 0', 'x = 1', 'x = e', 'x = any'], 0, 9, 'Math'),
('99999999-9999-9999-9999-999999999904', 'What is i¹⁰⁰?', ARRAY['i', '-1', '1', '-i'], 2, 9, 'Math'),
('99999999-9999-9999-9999-999999999905', 'What is d/dx[sin(x²)]?', ARRAY['cos(x²)', '2x·cos(x²)', '2x·sin(x²)', '-sin(x²)·2x'], 1, 9, 'Math'),
('99999999-9999-9999-9999-999999999906', 'What is the sum of arithmetic series 1+3+5+...+19?', ARRAY['90', '95', '100', '110'], 2, 9, 'Math'),
('99999999-9999-9999-9999-999999999907', 'What is cos(π)?', ARRAY['-1', '0', '1', 'π'], 0, 9, 'Math'),
('99999999-9999-9999-9999-999999999908', 'What is the Fibonacci sequence?', ARRAY['1,2,3...', '1,1,2,3...', '1,3,5...', '2,4,6...'], 1, 9, 'Math'),
('99999999-9999-9999-9999-999999999909', 'What is the capital of Canada?', ARRAY['Toronto', 'Vancouver', 'Ottawa', 'Montreal'], 2, 9, 'Geography'),
('99999999-9999-9999-9999-999999999910', 'What is the Higgs boson?', ARRAY['Force carrier', 'Mass giver', 'Energy particle', 'Gravity mediator'], 1, 9, 'Science'),
('99999999-9999-9999-9999-999999999911', 'What is string theory?', ARRAY['Particle physics', 'Quantum gravity', 'Cosmology', 'Thermodynamics'], 1, 9, 'Science'),
('99999999-9999-9999-9999-999999999912', 'What is the Alcubierre metric?', ARRAY['Star drive', 'Warp drive', 'Black hole', 'Gravity wave'], 1, 9, 'Science'),
('99999999-9999-9999-9999-999999999913', 'What is Hawking radiation?', ARRAY['Star radiation', 'Black hole emission', 'Neutrino burst', 'Cosmic rays'], 1, 9, 'Science'),
('99999999-9999-9999-9999-999999999914', 'What is the Fermi paradox?', ARRAY['Star paradox', 'Life paradox', 'Silence paradox', 'Gravity paradox'], 2, 9, 'Science'),
('99999999-9999-9999-9999-999999999915', 'What is d²y/dx² for y=x³?', ARRAY['3x', '6x', '6', '3x²'], 1, 9, 'Math'),
('99999999-9999-9999-9999-999999999916', 'What is the binomial theorem?', ARRAY['(a+b)n formula', 'Trig identity', 'Derivative rule', 'Integral formula'], 0, 9, 'Math'),
('99999999-9999-9999-9999-999999999917', 'What is the golden ratio?', ARRAY['1.414', '1.618', '2.718', '3.141'], 1, 9, 'Math'),
('99999999-9999-9999-9999-999999999918', 'What is Euler''s identity?', ARRAY['e^(iπ) = -1', 'e = mc²', 'F = ma', 'E = hf'], 0, 9, 'Math'),
('99999999-9999-9999-9999-999999999919', 'What is a magnetar?', ARRAY['Small magnet', 'Neutron star', 'White dwarf', 'Black dwarf'], 1, 9, 'Science'),
('99999999-9999-9999-9999-999999999920', 'What is the photosynthesis equation?', ARRAY['CO2 + H2O → O2 + Glucose', 'O2 + H2O → CO2 + Glucose', 'N2 + H2O → O2 + NH3', 'CO2 + O2 → C + O2'], 0, 9, 'Science'),

-- Difficulty 10 (Master) - Questions 181-200
('10101010-1010-1010-1010-101010101001', 'What is ∫₀¹ x² dx?', ARRAY['1/3', '1/2', '2/3', '1'], 0, 10, 'Math'),
('10101010-1010-1010-1010-101010101002', 'What is d/dx[tan(x)]?', ARRAY['sec²(x)', 'csc²(x)', 'sec(x)', 'csc(x)'], 0, 10, 'Math'),
('10101010-1010-1010-1010-101010101003', 'What is the Taylor series for eˣ?', ARRAY['Σxⁿ/n!', 'Σ(-1)ⁿx²n/(2n)!', 'Σ(-1)ⁿxⁿ/n', 'Σx²n+1/(2n+1)!'], 0, 10, 'Math'),
('10101010-1010-1010-1010-101010101004', 'What is the Laplace transform of 1?', ARRAY['1/s', 's', '1', 'δ(s)'], 0, 10, 'Math'),
('10101010-1010-1010-1010-101010101005', 'Solve: y'' + y = 0', ARRAY['y = Ce^-x', 'y = Ce^x', 'y = C', 'y = Cx'], 0, 10, 'Math'),
('10101010-1010-1010-1010-101010101006', 'What is the Gaussian integral?', ARRAY['π', '√π', '2π', 'π/2'], 1, 10, 'Math'),
('10101010-1010-1010-1010-101010101007', 'What is the Riemann Hypothesis?', ARRAY['Prime theorem', 'Zeta zeros', 'Number theory', 'Graph theory'], 1, 10, 'Math'),
('10101010-1010-1010-1010-101010101008', 'What is P vs NP?', ARRAY['Complexity class', 'Algorithm problem', 'Proof problem', 'All of above'], 3, 10, 'Math'),
('10101010-1010-1010-1010-101010101009', 'What is the capital of Russia?', ARRAY['St. Petersburg', 'Moscow', 'Novosibirsk', 'Kiev'], 1, 10, 'Geography'),
('10101010-1010-1010-1010-101010101010', 'What is the Wheeler-DeWitt equation?', ARRAY['Quantum gravity', 'Cosmology wavefunction', 'Black hole physics', 'String theory'], 1, 10, 'Science'),
('10101010-1010-1010-1010-101010101011', 'What is the cosmic microwave background?', ARRAY['Star light', 'Early universe radiation', 'Galaxy distribution', 'Dark matter'], 1, 10, 'Science'),
('10101010-1010-1010-1010-101010101012', 'What is the AdS/CFT correspondence?', ARRAY['String duality', 'Gravity/Gauge duality', 'Quantum duality', 'Math duality'], 1, 10, 'Science'),
('10101010-1010-1010-1010-101010101013', 'What is the Yang-Mills theory?', ARRAY['Electromagnetism', 'Quantum field theory', 'Particle physics', 'Gravity'], 1, 10, 'Science'),
('10101010-1010-1010-1010-101010101014', 'What is the Navier-Stokes equation?', ARRAY['Fluid dynamics', 'Quantum mechanics', 'Thermodynamics', 'Electromagnetism'], 0, 10, 'Science'),
('10101010-1010-1010-1010-101010101015', 'What is a Kerr black hole?', ARRAY['Rotating black hole', 'Charged black hole', 'Static black hole', 'Evaporating black hole'], 0, 10, 'Science'),
('10101010-1010-1010-1010-101010101016', 'What is the Chern-Simons theory?', ARRAY['Topology', 'Quantum field', 'String theory', 'Gravity'], 0, 10, 'Science'),
('10101010-1010-1010-1010-101010101017', 'What is mirror symmetry?', ARRAY['T-duality', 'String duality', 'Particle duality', 'Time duality'], 1, 10, 'Science'),
('10101010-1010-1010-1010-101010101018', 'What is the M-theory?', ARRAY['String theory', 'Quantum gravity', 'Unified theory', 'All of above'], 2, 10, 'Science'),
('10101010-1010-1010-1010-101010101019', 'What is the inflationary theory?', ARRAY['Star formation', 'Universe expansion', 'Galaxy formation', 'Particle creation'], 1, 10, 'Science'),
('10101010-1010-1010-1010-101010101020', 'What is loop quantum gravity?', ARRAY['String theory alternative', 'Quantum spacetime', 'Particle physics', 'Cosmology'], 1, 10, 'Science')
ON CONFLICT (id) DO NOTHING;

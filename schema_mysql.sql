
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(15),
  dob DATE,
  gender VARCHAR(20),
  address TEXT
);

CREATE TABLE employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  employeeId VARCHAR(20),
  pan VARCHAR(10),
  bankAccount VARCHAR(30),
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE medical_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  recordNumber VARCHAR(20),
  diagnosis TEXT,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE insurance_policies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  policyNumber VARCHAR(20),
  provider VARCHAR(100),
  FOREIGN KEY (userId) REFERENCES users(id)
);

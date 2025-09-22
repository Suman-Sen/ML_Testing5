
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(15),
  dob DATE,
  gender VARCHAR(20),
  address TEXT
);

CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  userId INTEGER REFERENCES users(id),
  employeeId VARCHAR(20),
  pan VARCHAR(10),
  bankAccount VARCHAR(30)
);

CREATE TABLE medical_records (
  id SERIAL PRIMARY KEY,
  userId INTEGER REFERENCES users(id),
  recordNumber VARCHAR(20),
  diagnosis TEXT
);

CREATE TABLE insurance_policies (
  id SERIAL PRIMARY KEY,
  userId INTEGER REFERENCES users(id),
  policyNumber VARCHAR(20),
  provider VARCHAR(100)
);

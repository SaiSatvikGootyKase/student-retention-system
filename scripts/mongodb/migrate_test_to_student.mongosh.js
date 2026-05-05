/**
 * Prefer Spring Boot: set app.migration.copy-test-to-student=true (or POST /api/v1/admin/migrations/test-to-student).
 *
 * mongosh: mongosh migrate_test_to_student.mongosh.js
 * Copies all collections from `test` -> `student`, creates `faculty` + `admins`,
 * indexes. MongoDB has no rename-database; this is the standard migration.
 * Optional: set DROP_SOURCE_TEST=true in shell before load to drop `test` after copy.
 */

const SOURCE_DB = "test";
const TARGET_DB = "student";

const source = db.getSiblingDB(SOURCE_DB);
const target = db.getSiblingDB(TARGET_DB);

const collectionsToCopy = [
  "announcements",
  "assignments",
  "attendance",
  "chat_messages",
  "exams",
  "fees",
  "course_recommendation",
  "results",
  "timetable",
  "users",
];

function copyCollection(name) {
  const coll = source.getCollection(name);
  const exists = source.getCollectionInfos({ name: name }).length > 0;
  if (!exists) {
    target.createCollection(name);
    print(`created empty: ${TARGET_DB}.${name}`);
    return;
  }
  const n = coll.estimatedDocumentCount();
  if (n === 0) {
    target.createCollection(name);
    print(`created empty: ${TARGET_DB}.${name}`);
    return;
  }
  coll.aggregate([{ $match: {} }, { $out: { db: TARGET_DB, coll: name } }]);
  print(`copied ${n} docs: ${SOURCE_DB}.${name} -> ${TARGET_DB}.${name}`);
}

collectionsToCopy.forEach(copyCollection);

function copyProfilesFromSource() {
  let srcName = null;
  if (source.getCollectionInfos({ name: "profiles" }).length > 0) srcName = "profiles";
  else if (source.getCollectionInfos({ name: "students" }).length > 0) srcName = "students";
  if (!srcName) {
    target.createCollection("profiles");
    print(`created empty: ${TARGET_DB}.profiles (no source students/profiles)`);
    return;
  }
  const coll = source.getCollection(srcName);
  const n = coll.estimatedDocumentCount();
  if (n === 0) {
    target.createCollection("profiles");
    print(`created empty: ${TARGET_DB}.profiles`);
    return;
  }
  coll.aggregate([{ $match: {} }, { $out: { db: TARGET_DB, coll: "profiles" } }]);
  print(`copied ${n} docs: ${SOURCE_DB}.${srcName} -> ${TARGET_DB}.profiles`);
}

copyProfilesFromSource();

const studentSchema = {
  bsonType: "object",
  additionalProperties: true,
  properties: {
    _id: { bsonType: "objectId" },
    firstName: { bsonType: "string" },
    lastName: { bsonType: "string" },
    email: { bsonType: "string" },
    password: { bsonType: "string" },
    phone: { bsonType: "string" },
    dateOfBirth: { bsonType: ["date", "null"] },
    gender: { bsonType: "string" },
    address: { bsonType: "string" },
    studentId: { bsonType: "string" },
    course: { bsonType: "string" },
    department: { bsonType: "string" },
    year: { bsonType: ["int", "long", "double", "null"] },
    createdAt: { bsonType: "date" },
    updatedAt: { bsonType: "date" },
  },
};

const facultySchema = {
  bsonType: "object",
  additionalProperties: true,
  required: [
    "firstName",
    "lastName",
    "email",
    "password",
    "department",
    "designation",
    "employeeId",
    "createdAt",
    "updatedAt",
  ],
  properties: {
    _id: { bsonType: "objectId" },
    firstName: { bsonType: "string" },
    lastName: { bsonType: "string" },
    email: { bsonType: "string" },
    password: { bsonType: "string" },
    phone: { bsonType: "string" },
    department: { bsonType: "string" },
    designation: { bsonType: "string" },
    employeeId: { bsonType: "string" },
    coursesHandled: { bsonType: "array", items: { bsonType: "string" } },
    createdAt: { bsonType: "date" },
    updatedAt: { bsonType: "date" },
  },
};

const adminSchema = {
  bsonType: "object",
  additionalProperties: true,
  required: ["firstName", "lastName", "email", "password", "role", "createdAt", "updatedAt"],
  properties: {
    _id: { bsonType: "objectId" },
    firstName: { bsonType: "string" },
    lastName: { bsonType: "string" },
    email: { bsonType: "string" },
    password: { bsonType: "string" },
    phone: { bsonType: "string" },
    role: { bsonType: "string" },
    permissions: { bsonType: "array", items: { bsonType: "string" } },
    createdAt: { bsonType: "date" },
    updatedAt: { bsonType: "date" },
  },
};

function ensureCollectionWithValidator(collName, validator) {
  const infos = target.getCollectionInfos({ name: collName });
  if (infos.length === 0) {
    target.createCollection(collName, {
      validator: { $jsonSchema: validator },
      validationLevel: "strict",
      validationAction: "error",
    });
    print(`created ${TARGET_DB}.${collName} with validator`);
    return;
  }
  const res = target.runCommand({
    collMod: collName,
    validator: { $jsonSchema: validator },
    validationLevel: "moderate",
    validationAction: "warn",
  });
  print(`collMod ${collName}: ${JSON.stringify(res)}`);
}

ensureCollectionWithValidator("profiles", studentSchema);
ensureCollectionWithValidator("faculty", facultySchema);
ensureCollectionWithValidator("admins", adminSchema);

const st = target.getCollection("profiles");
st.createIndex({ email: 1 }, { unique: true, sparse: true });
st.createIndex({ studentId: 1 }, { unique: true, sparse: true });

const fc = target.getCollection("faculty");
fc.createIndex({ email: 1 }, { unique: true });
fc.createIndex({ employeeId: 1 }, { unique: true });

const ad = target.getCollection("admins");
ad.createIndex({ email: 1 }, { unique: true });

print("indexes ensured on profiles, faculty, admins");

if (typeof DROP_SOURCE_TEST !== "undefined" && DROP_SOURCE_TEST === true) {
  print("dropping database " + SOURCE_DB);
  source.dropDatabase();
}

print("done. Use app URI: mongodb://localhost:27017/" + TARGET_DB);

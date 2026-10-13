
const mongodb = require("../data/database");
const ObjectId = require("mongodb").ObjectId;

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const requiredString = (value, field) => {
  if (typeof value !== "string" || !value.trim()) {
    throw createError(400, `${field} is required.`);
  }

  return value.trim();
};

const requiredInteger = (value, field) => {
  if (!Number.isInteger(value)) {
    throw createError(400, `${field} must be an integer.`);
  }

  return value;
};

const requieredMinLenght = (value, field, minLenght) => {
  // DEBUG: Log the lenght of the value
  // console.log(value + " is " + value.length + " characters long");

  if (value.length < minLenght) {
    throw createError(
      400,
      `${field} must be at least ${minLenght} characters long.`,
    );
  }

  return;
};

const requieredMaxLenght = (value, field, maxLenght) => {
  // DEBUG: Log the lenght of the value
  // console.log(value + " is " + value.length + " characters long");

  if (value.length > maxLenght) {
    throw createError(
      400,
      `${field} must be less than ${maxLenght} characters long.`,
    );
  }

  return;
};

const requieredValidAuthorIDCategoryID = (value, field) => {
  const minLenght = 4;
  const maxLenght = 4;

  const item = requiredString(value, field);
  requieredMinLenght(value, field, minLenght);
  requieredMaxLenght(value, field, maxLenght);

  return item;
};

// FIX: Validate a four-digit integer year numerically.
const requieredValidYear = (value, field) => {
  const year = requiredInteger(value, field);

  if (year < 1000 || year > 9999) {
    throw createError(400, `${field} must be a four-digit year.`);
  }

  return year;
};

const requieredValidISBN = (value, field) => {
  const minLenght = 10;
  const maxLenght = 17;

  const item = requiredString(value, field);
  requieredMinLenght(value, field, minLenght);
  requieredMaxLenght(value, field, maxLenght);

  return item;
};

const requieredValidSummary = (value, field) => {
  const minLenght = 30;
  const maxLenght = 700;

  const item = requiredString(value, field);
  requieredMinLenght(value, field, minLenght);
  requieredMaxLenght(value, field, maxLenght);

  return item;
};

const validateBookData = (data) => {
  if (!data || typeof data !== "object") {
    throw createError(400, "Book data is required.");
  }

  return {
    title: requiredString(data.title, "Book title"),
    isbn: requieredValidISBN(data.isbn, "Book isbn"),
    authorId: requieredValidAuthorIDCategoryID(data.authorId, "Book authorId"),
    categoryId: requieredValidAuthorIDCategoryID(
      data.categoryId,
      "Book categoryId",
    ),
    publishedYear: requieredValidYear(data.publishedYear, "Book publishedYear"),
    pages: requiredInteger(data.pages, "Book pages"),
    summary: requieredValidSummary(data.summary, "Book summary"),
  };
};

const getAll = async (req, res, next) => {
  //#swagger.tags=["Books"]
  try {
    const result = await mongodb.getDatabase().collection("books").find();
    const books = await result.toArray();

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(books);
  } catch (err) {
    console.error("Error fetching books:", err.message);
    err.status = 500;
    next(err);
  }
};

const getSingle = async (req, res, next) => {
  //#swagger.tags=["Books"]
  try {
    if (!ObjectId.isValid(req.params.id)) {
      throw createError(400, "Invalid book ID.");
    }

    const bookId = new ObjectId(req.params.id);
    const result = await mongodb
      .getDatabase()
      .collection("books")
      .find({ _id: bookId });

    const books = await result.toArray();

    if (!books || books.length === 0) {
      return res
        .status(404)
        .json({ message: "Error fetching book: Not found" });
    }

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(books[0]);
  } catch (err) {
    console.error("Error fetching book:", err.message);
    next(err);
  }
};

const createBook = async (req, res, next) => {
  //#swagger.tags=["Books"]
  try {
    const book = validateBookData(req.body);
    const result = await mongodb
      .getDatabase()
      .collection("books")
      .insertOne(book);

    res.status(201).json({
      _id: result.insertedId,
      ...book,
    });
  } catch (err) {
    console.error("Error creating book:", err.message);
    next(err);
  }
};

const updateBook = async (req, res, next) => {
  //#swagger.tags=["Books"]
  try {
    if (!ObjectId.isValid(req.params.id)) {
      throw createError(400, "Invalid book ID.");
    }

    const book = validateBookData(req.body);
    const result = await mongodb
      .getDatabase()
      .collection("books")
      .findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: book },
        { returnDocument: "after" },
      );

    if (!result) {
      return res
        .status(404)
        .json({ message: "Error updating book: Not found" });
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("Error updating book:", err.message);
    next(err);
  }
};

const deleteBook = async (req, res, next) => {
  //#swagger.tags=["Books"]
  try {
    if (!ObjectId.isValid(req.params.id)) {
      throw createError(400, "Invalid book ID.");
    }

    const result = await mongodb
      .getDatabase()
      .collection("books")
      .findOneAndDelete({ _id: new ObjectId(req.params.id) });

    if (!result) {
      return res
        .status(404)
        .json({ message: "Error deleting book: Not found" });
    }

    res.status(200).json({ message: "Book deleted successfully" });
  } catch (err) {
    console.error("Error deleting book:", err.message);
    next(err);
  }
};

module.exports = {
  getAll,
  getSingle,
  createBook,
  updateBook,
  deleteBook,
};


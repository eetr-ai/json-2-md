# json-2-md

Convert JSON to markdown using a JSON Schema. The schema validates the data and supplies human-readable labels (via `description`) for the generated headings and field names.

## Install

```bash
npm install @eetr/json-2-md
```

No runtime dependencies. Works in Node.js and browser.

## Quickstart

Define a schema with `description` on the root and each property. Object schemas must set `additionalProperties: false`. Pass your data and schema to `objectToMd`:

```javascript
import { objectToMd } from "@eetr/json-2-md";

const schema = {
  type: "object",
  description: "User profile",
  properties: {
    name: { type: "string", description: "User name" },
  },
  required: ["name"],
  additionalProperties: false,
};

const data = { name: "Alice" };
const md = objectToMd(data, schema);
console.log(md);
```

Output:

```markdown
# User profile

User name: Alice
```

## Examples

### Basic object

Same as quickstart: one object, one string field. The root `description` becomes the document title; each property’s `description` becomes the label for its value.

### Nested object

Nested objects are rendered with numbered sections in the default "document" strategy:

```javascript
const schema = {
  type: "object",
  description: "Profile",
  properties: {
    name: { type: "string", description: "User name" },
    address: {
      type: "object",
      properties: {
        street: { type: "string", description: "Street" },
        city: { type: "string", description: "City" },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};

const data = { name: "Alice", address: { street: "Main St", city: "Boston" } };
console.log(objectToMd(data, schema));
```

```markdown
# Profile

User name: Alice

## 1. Address

### 1.1. Street: Main St

### 1.2. City: Boston
```

### Array of primitives

Arrays of strings or numbers become numbered lists:

```javascript
const schema = {
  type: "object",
  description: "Document",
  properties: {
    title: { type: "string", description: "Title" },
    tags: {
      type: "array",
      items: { type: "string", description: "Tag" },
    },
  },
  additionalProperties: false,
};

const data = { title: "My doc", tags: ["a", "b"] };
console.log(objectToMd(data, schema));
```

```markdown
# Document

Title: My doc

1. a

2. b
```

### Format strategies

Use `formatStrategy: "document"` (default) for numbered sections and lists, or `"bullets"` for nested bullet lists:

```javascript
objectToMd(data, schema, { formatStrategy: "document" }); // ## 1. Address, ### 1.1. Street...
objectToMd(data, schema, { formatStrategy: "bullets" }); // - **User name**: Alice, - **Address**:,   - **Street**: ...
```

### Options

- **docTitle** – Override the document title (instead of root schema `description`).
- **fieldCopy** – Override the label for specific fields: `{ fieldCopy: { name: "Full name" } }`.
- **includeOriginal** – Append the original JSON in a fenced ` ```json ... ``` ` block at the end.
- **labelFromPath** – When a property has no description, use `"leaf"` (only the last path segment) or `"full"` for the full path. Default is `"leaf"`.
- **formatStrategy** – `"document"` or `"bullets"` as above.

Example:

```javascript
objectToMd(data, schema, {
  docTitle: "Custom Title",
  fieldCopy: { name: "Full name" },
  includeOriginal: true,
});
```

### Schema as string

You can pass the schema as a JSON string (e.g. when loaded from a file):

```javascript
const schemaString = JSON.stringify(schema);
objectToMd(data, schemaString);
```

### Validation

If the data does not match the schema (wrong types, missing required fields, or extra properties), `objectToMd` throws:

```javascript
objectToMd({ name: 123 }, schema);  // throws: expected string
objectToMd({}, schema);             // throws: missing required
```

## Schema requirements

- **additionalProperties** – Every object schema must set `additionalProperties: false`.
- **description** – Used as the document title (root) and as field labels (properties). Omit for a property to fall back to a label derived from the key (e.g. `street_name` → "Street name").
- **$ref** – Supported; definitions are resolved by the built-in resolver.

## API

### objectToMd(object, schema, options?)

Converts a validated object to markdown.

- **object** – The data to convert (must validate against the schema).
- **schema** – A JSON Schema object or JSON string. Object schemas must have `additionalProperties: false`.
- **options** – Optional. See [ObjectToMdOptions](src/markdown/types.ts): `includeOriginal`, `fieldCopy`, `docTitle`, `labelFromPath`, `formatStrategy`.

Returns a markdown string. Throws if the object is invalid.

### SchemaProcessor

For validation and description lookup without generating markdown: `new SchemaProcessor(schema)`, then `.process(json)` (returns `{ valid, validReason, fieldsDescription }`) and `.describe(path?)` for a property description at a given path.

### Case helpers

`keyToDescription(key)` turns a key into a readable label (e.g. camelCase or snake_case). Also exported: `detectCase`, `camelCaseToDescription`, `snakeCaseToDescription`.

## License

Apache-2.0

# MongoDB Design

## Users

### User Schema

```json
{
    _id,
    username: UNIQE,
    email: UNIQE,
    passsword: (Hashed),
}
```

## Forms

### Form Types

    Multi choises
    short text
    long text
    rating
    Yes or No

### Form Schema

```json
{
  _id: ObjectId,
  creatorId: ObjectId,           // ref: users._id
  title: String,
  description: String,
  status: "draft" | "published" | "closed",
  responseCount: Number,         // atomic counter used to enforce maxResponses
  settings: {
    expiresAt: Date | null,      // null = no expiration
    maxResponses: Number | null, // null = unlimited
    limitOnePerUser: Boolean
  },
  questions: [
    {
      questionId: String,        // safe prefixed ID (e.g., "q_8f2a9c"), immutable once created
      type: "short_text" | "long_text" | "single_choice" | "multi_choice" | "rating" | "number" | "boolean",
      label: String,
      required: Boolean,
      order: Number,
      archived: Boolean,         // false = live; true = hidden from new respondents, kept for historical responses
      config: {
        // For single_choice / multi_choice (stable option IDs; never store labels in responses)
        options: [
          {
            id: String,          // safe prefixed ID (e.g., "opt_1a2b")
            label: String,
            archived: Boolean    // soft-delete individual options once responses exist
          }
        ],
        // For rating / number
        min: Number,
        max: Number,
        // For short_text / long_text
        maxLength: Number
      }
    }
  ],
            slug: String,                  // unique URL identifier (e.g., "cs-dept-feedback-x9k2")
  createdAt: Date,
  updatedAt: Date
}
```

## Responses

### Responses Schema

```json
{
    _id: ObjectId,
    formId: ObjectId,              // ref: forms._id
    respondentId: ObjectId | null, // ref: users._id (null for anonymous submissions)
    answers: {
        // Keyed by questionId from forms.questions
        q_8f2a9c: {
            type: "short_text",
            value: "Great pacing overall."
        },
        q_3b1d4e: {
            type: "rating",
            value: 5
        },
        q_7c9e2a: {
            type: "single_choice",
            value: ["opt_1a2b"]        // always an array of stable option IDs
        },
        q_5a4f1b: {
            type: "multi_choice",
            value: ["opt_3c4d", "opt_5e6f"]
        },
        q_9d2e1a: {
            type: "boolean",
            value: true
        }
    },
    submittedAt: Date
}

```

# form_stats

```json
{
  _id: ObjectId,
  formId: ObjectId,              // unique ref: forms._id
  totalResponses: Number,
  questions: {
    // Numeric / rating questions: compute avg = sum / answeredCount at read time
    q_3b1d4e: {
      answeredCount: Number,
      sum: Number,
      buckets: {                 // distribution histogram keyed by value string
        "1": Number,
        "2": Number,
        "3": Number,
        "4": Number,
        "5": Number
      }
    },
    // Choice questions: keyed by stable option ID
    q_7c9e2a: {
      answeredCount: Number,
      optionCounts: {
        opt_1a2b: Number,
        opt_9x8y: Number
      }
    },
    // Boolean questions
    q_9d2e1a: {
      answeredCount: Number,
      trueCount: Number,
      falseCount: Number
    },
    // Text questions (actual text is paginated from responses)
    q_8f2a9c: {
      answeredCount: Number
    }
  },
  updatedAt: Date
}
```

# Indexes

https://app.notion.com/p/Indexes-4211d45d6652806e851fc0161449ac9c

-- =====================================================
-- PostgreSQL DATABASE SCHEMA
-- Task Exchange / Student Marketplace Platform
-- =====================================================

-- =====================================================
-- TABLE: student_statuses
-- =====================================================

CREATE TABLE student_statuses (
    id                      SERIAL PRIMARY KEY,
    name                    VARCHAR(50) NOT NULL UNIQUE
);

-- =====================================================
-- TABLE: students
-- =====================================================

CREATE TABLE students (
    id                      SERIAL PRIMARY KEY,

    last_name               VARCHAR(100) NOT NULL,
    first_name              VARCHAR(100) NOT NULL,
    middle_name             VARCHAR(100),

    email                   VARCHAR(255) NOT NULL,
    password_hash           TEXT NOT NULL,

    registration_date       TIMESTAMP NOT NULL DEFAULT NOW(),

    student_status_id       INT NOT NULL,

    CONSTRAINT uq_students_email
        UNIQUE (email),

    CONSTRAINT fk_students_status
        FOREIGN KEY (student_status_id)
        REFERENCES student_statuses(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_students_status_id
    ON students(student_status_id);

-- =====================================================
-- TABLE: categories
-- =====================================================

CREATE TABLE categories (
    id                      SERIAL PRIMARY KEY,

    name                    VARCHAR(150) NOT NULL UNIQUE,

    description             TEXT
);

-- =====================================================
-- TABLE: skills
-- =====================================================

CREATE TABLE skills (
    id                      SERIAL PRIMARY KEY,

    name                    VARCHAR(150) NOT NULL UNIQUE,

    description             TEXT
);

-- =====================================================
-- TABLE: task_statuses
-- =====================================================

CREATE TABLE task_statuses (
    id                      SERIAL PRIMARY KEY,

    name                    VARCHAR(100) NOT NULL UNIQUE
);

-- =====================================================
-- TABLE: response_statuses
-- =====================================================

CREATE TABLE response_statuses (
    id                      SERIAL PRIMARY KEY,

    name                    VARCHAR(100) NOT NULL UNIQUE
);

-- =====================================================
-- TABLE: tasks
-- =====================================================

CREATE TABLE tasks (
    id                          SERIAL PRIMARY KEY,

    title                       VARCHAR(255) NOT NULL,

    description                 TEXT NOT NULL,

    deadline                    TIMESTAMP NOT NULL,

    created_at                  TIMESTAMP NOT NULL DEFAULT NOW(),

    updated_at                  TIMESTAMP,

    deleted                     BOOLEAN NOT NULL DEFAULT FALSE,

    deleted_at                  TIMESTAMP,

    category_id                 INT NOT NULL,

    task_status_id              INT NOT NULL,

    customer_student_id         INT NOT NULL,

    executor_student_id         INT,

    is_pinned                   BOOLEAN NOT NULL DEFAULT FALSE,

    pinned_at                   TIMESTAMP,

    CONSTRAINT fk_tasks_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_tasks_task_status
        FOREIGN KEY (task_status_id)
        REFERENCES task_statuses(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_tasks_customer_student
        FOREIGN KEY (customer_student_id)
        REFERENCES students(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_tasks_executor_student
        FOREIGN KEY (executor_student_id)
        REFERENCES students(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_tasks_customer_executor
        CHECK (
            executor_student_id IS NULL
            OR executor_student_id <> customer_student_id
        ),

    CONSTRAINT chk_tasks_deadline
        CHECK (
            created_at <= deadline
        ),

    CONSTRAINT chk_tasks_deleted
        CHECK (
            (deleted = FALSE AND deleted_at IS NULL)
            OR
            (deleted = TRUE AND deleted_at IS NOT NULL)
        ),

    CONSTRAINT chk_tasks_pinned
        CHECK (
            (is_pinned = FALSE AND pinned_at IS NULL)
            OR
            (is_pinned = TRUE AND pinned_at IS NOT NULL)
        )
);

CREATE INDEX idx_tasks_customer_student_id
    ON tasks(customer_student_id);

CREATE INDEX idx_tasks_executor_student_id
    ON tasks(executor_student_id);

CREATE INDEX idx_tasks_category_id
    ON tasks(category_id);

CREATE INDEX idx_tasks_task_status_id
    ON tasks(task_status_id);

CREATE INDEX idx_tasks_deleted
    ON tasks(deleted);

-- =====================================================
-- TABLE: task_status_history
-- =====================================================

CREATE TABLE task_status_history (
    id                          SERIAL PRIMARY KEY,

    task_id                     INT NOT NULL,

    status_id                   INT NOT NULL,

    changed_by_student_id       INT NOT NULL,

    changed_at                  TIMESTAMP NOT NULL DEFAULT NOW(),

    comment_text                TEXT,

    CONSTRAINT fk_task_history_task
        FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_task_history_status
        FOREIGN KEY (status_id)
        REFERENCES task_statuses(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_task_history_student
        FOREIGN KEY (changed_by_student_id)
        REFERENCES students(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_task_status_history_task_id
    ON task_status_history(task_id);

-- =====================================================
-- TABLE: responses
-- =====================================================

CREATE TABLE responses (
    id                              SERIAL PRIMARY KEY,

    task_id                         INT NOT NULL,

    responder_student_id            INT NOT NULL,

    response_status_id              INT NOT NULL,

    comment_text                    TEXT NOT NULL,

    created_at                      TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_responses_task
        FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_responses_responder_student
        FOREIGN KEY (responder_student_id)
        REFERENCES students(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_responses_status
        FOREIGN KEY (response_status_id)
        REFERENCES response_statuses(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_responses_task_responder
        UNIQUE (task_id, responder_student_id)
);

CREATE INDEX idx_responses_task_id
    ON responses(task_id);

CREATE INDEX idx_responses_responder_student_id
    ON responses(responder_student_id);

-- =====================================================
-- TABLE: response_status_history
-- =====================================================

CREATE TABLE response_status_history (
    id                              SERIAL PRIMARY KEY,

    response_id                     INT NOT NULL,

    status_id                       INT NOT NULL,

    changed_by_student_id           INT NOT NULL,

    changed_at                      TIMESTAMP NOT NULL DEFAULT NOW(),

    comment_text                    TEXT,

    CONSTRAINT fk_response_history_response
        FOREIGN KEY (response_id)
        REFERENCES responses(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_response_history_status
        FOREIGN KEY (status_id)
        REFERENCES response_statuses(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_response_history_student
        FOREIGN KEY (changed_by_student_id)
        REFERENCES students(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_response_history_response_id
    ON response_status_history(response_id);

-- =====================================================
-- TABLE: comments
-- =====================================================

CREATE TABLE comments (
    id                              SERIAL PRIMARY KEY,

    task_id                         INT NOT NULL,

    author_student_id              INT NOT NULL,

    parent_comment_id              INT,

    comment_text                   TEXT NOT NULL,

    created_at                     TIMESTAMP NOT NULL DEFAULT NOW(),

    updated_at                     TIMESTAMP,

    deleted                        BOOLEAN NOT NULL DEFAULT FALSE,

    deleted_at                     TIMESTAMP,

    is_pinned                      BOOLEAN NOT NULL DEFAULT FALSE,

    pinned_at                      TIMESTAMP,

    CONSTRAINT fk_comments_task
        FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_comments_author_student
        FOREIGN KEY (author_student_id)
        REFERENCES students(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_comments_parent
        FOREIGN KEY (parent_comment_id)
        REFERENCES comments(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_comments_no_self_reference
        CHECK (
            parent_comment_id IS NULL
            OR parent_comment_id <> id
        ),

    CONSTRAINT chk_comments_deleted
        CHECK (
            (deleted = FALSE AND deleted_at IS NULL)
            OR
            (deleted = TRUE AND deleted_at IS NOT NULL)
        ),

    CONSTRAINT chk_comments_pinned
        CHECK (
            (is_pinned = FALSE AND pinned_at IS NULL)
            OR
            (is_pinned = TRUE AND pinned_at IS NOT NULL)
        )
);

CREATE INDEX idx_comments_task_id
    ON comments(task_id);

CREATE INDEX idx_comments_author_student_id
    ON comments(author_student_id);

CREATE INDEX idx_comments_parent_comment_id
    ON comments(parent_comment_id);

-- =====================================================
-- TABLE: reviews
-- =====================================================

CREATE TABLE reviews (
    id                              SERIAL PRIMARY KEY,

    task_id                         INT NOT NULL UNIQUE,

    reviewer_student_id             INT NOT NULL,

    reviewed_student_id             INT NOT NULL,

    rating                          INT NOT NULL,

    review_text                     TEXT,

    created_at                      TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_reviews_task
        FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reviews_reviewer
        FOREIGN KEY (reviewer_student_id)
        REFERENCES students(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_reviews_reviewed
        FOREIGN KEY (reviewed_student_id)
        REFERENCES students(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_reviews_rating
        CHECK (
            rating >= 1
            AND rating <= 5
        ),

    CONSTRAINT chk_reviews_not_self
        CHECK (
            reviewer_student_id <> reviewed_student_id
        )
);

-- =====================================================
-- TABLE: student_skills
-- =====================================================

CREATE TABLE student_skills (
    id                              SERIAL PRIMARY KEY,

    student_id                      INT NOT NULL,

    skill_id                        INT NOT NULL,

    added_at                        TIMESTAMP NOT NULL DEFAULT NOW(),

    comment_text                    TEXT,

    CONSTRAINT fk_student_skills_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_student_skills_skill
        FOREIGN KEY (skill_id)
        REFERENCES skills(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_student_skills
        UNIQUE (student_id, skill_id)
);

-- =====================================================
-- TABLE: task_skills
-- =====================================================

CREATE TABLE task_skills (
    id                              SERIAL PRIMARY KEY,

    task_id                         INT NOT NULL,

    skill_id                        INT NOT NULL,

    added_at                        TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_task_skills_task
        FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_task_skills_skill
        FOREIGN KEY (skill_id)
        REFERENCES skills(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_task_skills
        UNIQUE (task_id, skill_id)
);

-- =====================================================
-- VIEW: student_ratings
-- =====================================================

CREATE VIEW student_ratings AS
SELECT
    s.id AS student_id,
    ROUND(AVG(r.rating)::NUMERIC, 2) AS rating
FROM students s
LEFT JOIN reviews r
    ON r.reviewed_student_id = s.id
GROUP BY s.id;

-- =====================================================
-- TRIGGER FUNCTION:
-- AUTO UPDATE updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS: updated_at
-- =====================================================

CREATE TRIGGER trg_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_comments_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION fn_set_updated_at();

-- =====================================================
-- TRIGGER FUNCTION:
-- SELF RESPONSE FORBIDDEN
-- =====================================================

CREATE OR REPLACE FUNCTION fn_prevent_self_response()
RETURNS TRIGGER AS $$
DECLARE
    v_customer_id INT;
BEGIN
    SELECT customer_student_id
    INTO v_customer_id
    FROM tasks
    WHERE id = NEW.task_id;

    IF NEW.responder_student_id = v_customer_id THEN
        RAISE EXCEPTION
            'Student cannot respond to own task';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_self_response
BEFORE INSERT ON responses
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_self_response();

-- =====================================================
-- TRIGGER FUNCTION:
-- EXECUTOR MUST HAVE RESPONSE
-- =====================================================

CREATE OR REPLACE FUNCTION fn_validate_executor()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.executor_student_id IS NOT NULL THEN

        IF NOT EXISTS (
            SELECT 1
            FROM responses r
            WHERE r.task_id = NEW.id
              AND r.responder_student_id = NEW.executor_student_id
        ) THEN
            RAISE EXCEPTION
                'Executor must have response for this task';
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_executor
BEFORE UPDATE OF executor_student_id ON tasks
FOR EACH ROW
EXECUTE FUNCTION fn_validate_executor();

-- =====================================================
-- TRIGGER FUNCTION:
-- REVIEW ONLY AFTER COMPLETED
-- =====================================================

CREATE OR REPLACE FUNCTION fn_validate_review()
RETURNS TRIGGER AS $$
DECLARE
    v_status_name TEXT;
    v_customer_id INT;
    v_executor_id INT;
BEGIN

    SELECT
        ts.name,
        t.customer_student_id,
        t.executor_student_id
    INTO
        v_status_name,
        v_customer_id,
        v_executor_id
    FROM tasks t
    JOIN task_statuses ts
        ON ts.id = t.task_status_id
    WHERE t.id = NEW.task_id;

    IF v_status_name <> 'completed' THEN
        RAISE EXCEPTION
            'Review allowed only for completed tasks';
    END IF;

    IF NEW.reviewer_student_id <> v_customer_id THEN
        RAISE EXCEPTION
            'Only customer can leave review';
    END IF;

    IF NEW.reviewed_student_id <> v_executor_id THEN
        RAISE EXCEPTION
            'Review must target task executor';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_review
BEFORE INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION fn_validate_review();

-- =====================================================
-- TRIGGER FUNCTION:
-- TASK WORKFLOW VALIDATION
-- =====================================================

CREATE OR REPLACE FUNCTION fn_validate_task_workflow()
RETURNS TRIGGER AS $$
DECLARE
    old_status TEXT;
    new_status TEXT;
BEGIN

    SELECT name
    INTO old_status
    FROM task_statuses
    WHERE id = OLD.task_status_id;

    SELECT name
    INTO new_status
    FROM task_statuses
    WHERE id = NEW.task_status_id;

    IF old_status = 'draft'
       AND new_status <> 'published'
    THEN
        RAISE EXCEPTION 'Invalid status transition';
    END IF;

    IF old_status = 'published'
       AND new_status <> 'executor_selected'
    THEN
        RAISE EXCEPTION 'Invalid status transition';
    END IF;

    IF old_status = 'executor_selected'
       AND new_status <> 'in_progress'
    THEN
        RAISE EXCEPTION 'Invalid status transition';
    END IF;

    IF old_status = 'in_progress'
       AND new_status <> 'on_review'
    THEN
        RAISE EXCEPTION 'Invalid status transition';
    END IF;

    IF old_status = 'on_review'
       AND new_status <> 'completed'
    THEN
        RAISE EXCEPTION 'Invalid status transition';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_task_workflow
BEFORE UPDATE OF task_status_id ON tasks
FOR EACH ROW
EXECUTE FUNCTION fn_validate_task_workflow();

-- =====================================================
-- TRIGGER FUNCTION:
-- AUTO TASK STATUS HISTORY
-- =====================================================

CREATE OR REPLACE FUNCTION fn_task_status_history()
RETURNS TRIGGER AS $$
BEGIN

    INSERT INTO task_status_history (
        task_id,
        status_id,
        changed_by_student_id,
        changed_at
    )
    VALUES (
        NEW.id,
        NEW.task_status_id,
        NEW.customer_student_id,
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_task_status_history
AFTER UPDATE OF task_status_id ON tasks
FOR EACH ROW
EXECUTE FUNCTION fn_task_status_history();

-- =====================================================
-- TRIGGER FUNCTION:
-- AUTO RESPONSE STATUS HISTORY
-- =====================================================

CREATE OR REPLACE FUNCTION fn_response_status_history()
RETURNS TRIGGER AS $$
BEGIN

    INSERT INTO response_status_history (
        response_id,
        status_id,
        changed_by_student_id,
        changed_at
    )
    VALUES (
        NEW.id,
        NEW.response_status_id,
        NEW.responder_student_id,
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_response_status_history
AFTER UPDATE OF response_status_id ON responses
FOR EACH ROW
EXECUTE FUNCTION fn_response_status_history();
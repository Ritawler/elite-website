-- ELITE platform — correct the monthly evaluation scale
--
-- staff_evaluations.sql originally shipped a single "rating 1-5" column.
-- The correct scale is: base_score (1-12) + a separate bonus_points (0-2).
-- Run this once against a database that already has the old column.

alter table public.staff_evaluations
  drop constraint if exists staff_evaluations_rating_check;

alter table public.staff_evaluations
  rename column rating to base_score;

alter table public.staff_evaluations
  add constraint staff_evaluations_base_score_check check (base_score between 1 and 12);

alter table public.staff_evaluations
  add column if not exists bonus_points smallint not null default 0 check (bonus_points between 0 and 2);

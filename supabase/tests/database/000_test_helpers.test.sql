-- pgTAP 테스트가 함께 쓰는 도우미 함수를 만든다.
-- `pnpm db:test`(supabase test db)는 이 폴더의 파일을 이름 순서로 실행하므로 이 파일이 가장 먼저 실행된다.
-- 다른 테스트 파일은 begin ... rollback으로 감싸지만, 이 파일은 뒤 파일이 도우미를 쓸 수 있도록 커밋한다.
-- 도우미는 로컬과 CI의 테스트 DB에만 만들고, 마이그레이션에는 넣지 않으므로 운영 DB에는 생기지 않는다.
--
-- 사용법
--   select tests.create_auth_user('<uuid>');                 -- 인증만 마친 사용자(auth.users 행)를 만든다
--   select tests.create_auth_session('<user uuid>', '<session uuid>');  -- 로그인 세션(auth.sessions 행)을 만든다
--   select tests.authenticate_as('<user uuid>', '<session uuid>');      -- 그 사용자의 세션으로 요청하는 상태가 된다
--   select tests.authenticate_as_anon();                     -- 로그인하지 않은 방문자로 요청하는 상태가 된다
--   reset role;                                              -- 테스트를 준비하는 관리자 역할로 돌아온다

create extension if not exists pgtap with schema extensions;

create schema if not exists tests;
grant usage on schema tests to anon, authenticated;

create or replace function tests.create_auth_user(p_id uuid default gen_random_uuid(), p_email text default null)
returns uuid
language sql
as $$
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (p_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email, '{}'::jsonb, '{}'::jsonb, now(), now())
  returning id;
$$;

create or replace function tests.create_auth_session(p_user_id uuid, p_id uuid default gen_random_uuid())
returns uuid
language sql
as $$
  insert into auth.sessions (id, user_id, created_at, updated_at, aal)
  values (p_id, p_user_id, now(), now(), 'aal1')
  returning id;
$$;

-- Supabase가 발급한 액세스 토큰을 받은 것처럼 JWT 클레임과 역할을 이번 트랜잭션에만 바꾼다.
-- RLS 정책의 auth.uid()와 auth.jwt()는 이 클레임을 읽는다.
create or replace function tests.authenticate_as(p_user_id uuid, p_session_id uuid default null)
returns void
language plpgsql
as $$
begin
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', 'aal1', 'session_id', p_session_id)::text,
    true
  );
  perform set_config('role', 'authenticated', true);
end;
$$;

create or replace function tests.authenticate_as_anon()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', jsonb_build_object('role', 'anon')::text, true);
  perform set_config('role', 'anon', true);
end;
$$;

grant execute on all functions in schema tests to anon, authenticated;

select plan(1);
select has_function('tests', 'authenticate_as', array['uuid', 'uuid'], '테스트 도우미 함수를 만들었다');
select * from finish();

-- 000_test_helpers.test.sql이 만든 도우미가 RLS 테스트에 필요한 요청 상태를 만드는지 확인한다.
begin;
select plan(7);

select tests.create_auth_user('11111111-1111-4111-8111-111111111111');
select tests.create_auth_session('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222');

select isnt_empty(
  $$ select 1 from auth.sessions where id = '22222222-2222-4222-8222-222222222222' and user_id = '11111111-1111-4111-8111-111111111111' $$,
  '로그인 세션 행을 만든다'
);

select tests.authenticate_as('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222');
select is(current_user::text, 'authenticated', '회원 세션으로 바꾸면 authenticated 역할로 요청한다');
select is(auth.uid(), '11111111-1111-4111-8111-111111111111'::uuid, 'auth.uid()가 흉내 낸 사용자 ID를 알려 준다');
select is(auth.jwt() ->> 'session_id', '22222222-2222-4222-8222-222222222222', 'JWT 클레임에 세션 ID가 들어 있다');

select tests.authenticate_as_anon();
select is(current_user::text, 'anon', '방문자로 바꾸면 anon 역할로 요청한다');
select is(auth.uid(), null, '방문자의 auth.uid()는 비어 있다');

reset role;
select is(current_user::text, 'postgres', 'reset role로 테스트를 준비하는 역할로 돌아온다');

select * from finish();
rollback;

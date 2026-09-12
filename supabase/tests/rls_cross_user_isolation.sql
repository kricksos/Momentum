begin;

-- Este script debe ejecutarse con pgTAP y un entorno donde
-- exista al menos un usuario A y un usuario B autenticados.
-- Es una prueba de aislamiento transversal real, no solo de existencia de políticas.

select plan(8);

-- Requiere que las variables de sesión del usuario se establezcan antes de cada comprobación.
-- Ejemplo de uso:
-- set request.jwt.claims = '{"sub":"USER_A_ID"}';
-- set role authenticated;

-- 1. Un usuario no debe poder ver el perfil del otro.
select throws_like(
  $$
    select id from public.profiles where user_id = 'USER_B_ID'::uuid;
  $$,
  '%permission denied%'
);

-- 2. Un usuario no debe poder ver planes de trabajo del otro.
select throws_like(
  $$
    select id from public.workout_plans where user_id = 'USER_B_ID'::uuid;
  $$,
  '%permission denied%'
);

-- 3. Un usuario no debe poder ver nutrición del otro.
select throws_like(
  $$
    select id from public.nutrition_plans where user_id = 'USER_B_ID'::uuid;
  $$,
  '%permission denied%'
);

-- 4. Un usuario no debe poder ver medidas del otro.
select throws_like(
  $$
    select id from public.body_measurements where user_id = 'USER_B_ID'::uuid;
  $$,
  '%permission denied%'
);

-- 5. Un usuario no debe poder ver consentimientos del otro.
select throws_like(
  $$
    select id from public.user_consents where user_id = 'USER_B_ID'::uuid;
  $$,
  '%permission denied%'
);

-- 6. Un usuario no debe poder modificar un perfil que no es suyo.
select throws_like(
  $$
    update public.profiles set name = 'HACKED' where user_id = 'USER_B_ID'::uuid;
  $$,
  '%permission denied%'
);

-- 7. Un usuario no debe poder crear registros asociados a otro usuario.
select throws_like(
  $$
    insert into public.body_measurements (user_id, weight_kg) values ('USER_B_ID'::uuid, 75.5);
  $$,
  '%permission denied%'
);

-- 8. El usuario sí debe poder ver y modificar solo sus propios datos.
select results_eq(
  $$
    select count(*)::int from public.profiles where user_id = 'USER_A_ID'::uuid;
  $$,
  $$
    values (1::int);
  $$,
  'usuario A puede ver solo su perfil'
);

select * from finish();
rollback;

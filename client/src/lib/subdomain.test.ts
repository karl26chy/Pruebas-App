import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseSubdomainFromHostname,
  isPlainLocalhost,
  resolveActiveSubdomain,
} from './subdomain.ts';

describe('parseSubdomainFromHostname', () => {
  test('dev local con subdominio', () => {
    assert.equal(parseSubdomainFromHostname('alegria.localhost'), 'alegria');
    assert.equal(parseSubdomainFromHostname('otra.localhost'), 'otra');
  });

  test('producción con subdominio', () => {
    assert.equal(parseSubdomainFromHostname('alegria.midominio.com'), 'alegria');
    assert.equal(parseSubdomainFromHostname('colegiosanignacio.plataforma.com'), 'colegiosanignacio');
  });

  test('localhost plano e IPs devuelven null', () => {
    assert.equal(parseSubdomainFromHostname('localhost'), null);
    assert.equal(parseSubdomainFromHostname('127.0.0.1'), null);
    assert.equal(parseSubdomainFromHostname('::1'), null);
    assert.equal(parseSubdomainFromHostname('192.168.1.10'), null);
  });

  test('hosts *.onrender.com devuelven null (portal general de Render)', () => {
    assert.equal(parseSubdomainFromHostname('mi-plataforma.onrender.com'), null);
    assert.equal(parseSubdomainFromHostname('platform-api.onrender.com'), null);
    assert.equal(parseSubdomainFromHostname('platform-frontend.onrender.com'), null);
  });

  test('dominio plano sin subdominio devuelve null', () => {
    assert.equal(parseSubdomainFromHostname('midominio.com'), null);
  });
});

describe('isPlainLocalhost', () => {
  test('solo localhost exacto', () => {
    assert.equal(isPlainLocalhost('localhost'), true);
    assert.equal(isPlainLocalhost('alegria.localhost'), false);
    assert.equal(isPlainLocalhost('127.0.0.1'), false);
    assert.equal(isPlainLocalhost('midominio.com'), false);
  });
});

describe('resolveActiveSubdomain (prioridad hostname real)', () => {
  test('un subdominio real nunca es sobreescrito por el simulado', () => {
    assert.equal(resolveActiveSubdomain('alegria.localhost', 'otra'), 'alegria');
    assert.equal(resolveActiveSubdomain('otra.localhost', 'alegria'), 'otra');
    assert.equal(resolveActiveSubdomain('alegria.midominio.com', 'otra'), 'alegria');
  });

  test('localhost plano admite el simulado', () => {
    assert.equal(resolveActiveSubdomain('localhost', 'alegria'), 'alegria');
    assert.equal(resolveActiveSubdomain('localhost', null), null);
  });

  test('portal general de Render admite el simulado', () => {
    assert.equal(resolveActiveSubdomain('mi-plataforma.onrender.com', 'alegria'), 'alegria');
    assert.equal(resolveActiveSubdomain('platform-frontend.onrender.com', null), null);
  });

  test('IPs y dominios planos ignoran el simulado', () => {
    assert.equal(resolveActiveSubdomain('127.0.0.1', 'otra'), null);
    assert.equal(resolveActiveSubdomain('::1', 'otra'), null);
    assert.equal(resolveActiveSubdomain('midominio.com', 'otra'), null);
  });
});

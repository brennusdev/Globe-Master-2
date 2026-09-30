export default async function run(page, ui) {
  const result = {};

  // 1. Menu mobile: reduz a janela, clica no toggle, verifica .active
  await page.setViewportSize({ width: 500, height: 800 });
  const homeSnap = await ui.snapshot();
  const toggleRef = homeSnap.match(/@(e\d+) button "Abrir menu"/)?.[1];
  if (!toggleRef) return { error: 'menu-toggle nao encontrado', snapshot: homeSnap };
  await ui.click(toggleRef); // menu-toggle
  await page.waitForTimeout(300);
  result.menuOpens = await page.evaluate(() => document.querySelector('.nav-links').classList.contains('active'));

  // 2. Vai para cadastro e envia o formulário
  await page.goto('http://localhost:8080/Backend/cadastro.html');
  const snap = await ui.snapshot();
  result.cadastroFormVisible = snap.includes('textbox');
  await page.fill('#nomeCompleto', 'Usuario Teste');
  await page.fill('#emailCadastro', 'teste@globemaster.com');
  await page.fill('#usuarioCadastro', 'usuarioteste');
  await page.fill('#senhaCadastro', 'senha123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1200);
  result.cadastroAlert = await page.evaluate(() => {
    const a = document.querySelector('.js-alert');
    return a ? a.textContent : null;
  });

  // 3. Vai para login e autentica com o usuário criado
  await page.goto('http://localhost:8080/Backend/Login.html');
  await page.fill('#username', 'usuarioteste');
  await page.fill('#password', 'senha123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);
  result.loginUrl = page.url();
  result.loginAlert = await page.evaluate(() => {
    const a = document.querySelector('.js-alert');
    return a ? a.textContent : null;
  });

  return result;
}

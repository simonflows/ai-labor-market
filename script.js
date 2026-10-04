(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Chromium умеет SVG-фильтры в backdrop-filter, остальным оставим обычное размытие
  if (window.chrome) document.documentElement.classList.add('chromium');

  /* ============ Заголовок по словам ============ */
  let wi = 0;
  $$('#title [data-line]').forEach(line => {
    const words = line.textContent.trim().split(/\s+/);
    line.innerHTML = words.map(w => `<span class="w"><span class="wi" style="--i:${wi++}">${w}</span></span>`).join(' ');
  });

  /* ============ Звёздное небо ============ */
  const cv = $('#space'), ctx = cv.getContext('2d');
  let W, H, dpr, stars = [], shots = [], mx = 0, my = 0, tx = 0, ty = 0, sx = 0, sy = 0, tsx = 0, tsy = 0, nextShot = 2500;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((W * H) / 5200);
    stars = Array.from({ length: n }, () => ({
      x: Math.random(), y: Math.random(),
      z: Math.pow(Math.random(), 1.8) * .95 + .05,
      p: Math.random() * 6.28, s: .4 + Math.random() * 1.6,
      warm: Math.random() < .12
    }));
  }

  function frame(t) {
    mx += (tx - mx) * .05; my += (ty - my) * .05;
    ctx.clearRect(0, 0, W, H);
    const scrollY = window.scrollY;
    for (const s of stars) {
      const px = ((s.x * W + mx * s.z * 40) % W + W) % W;
      const py = (((s.y * H - scrollY * s.z * .35 + my * s.z * 40) % H) + H) % H;
      const tw = RM ? 1 : .55 + .45 * Math.sin(t * .001 * s.s + s.p);
      const a = (.18 + .82 * s.z) * tw;
      const r = .25 + s.z * 1.25;
      ctx.fillStyle = s.warm ? `rgba(255,226,184,${a})` : `rgba(255,255,255,${a})`;
      ctx.beginPath(); ctx.arc(px, py, r, 0, 6.283); ctx.fill();
      if (s.z > .9) {
        ctx.fillStyle = `rgba(255,255,255,${a * .12})`;
        ctx.beginPath(); ctx.arc(px, py, r * 4, 0, 6.283); ctx.fill();
      }
    }
    if (!RM) {
      if (t > nextShot) {
        const ang = .5 + Math.random() * .4;
        shots.push({ x: Math.random() * W * .8 + W * .2, y: Math.random() * H * .5, a: ang, v: 9 + Math.random() * 6, l: 0, life: 0 });
        nextShot = t + 3500 + Math.random() * 6000;
      }
      shots = shots.filter(s => s.life < 1);
      for (const s of shots) {
        s.x -= Math.cos(s.a) * s.v; s.y += Math.sin(s.a) * s.v; s.life += .018;
        const len = 120 * Math.sin(Math.min(s.life, 1) * Math.PI);
        const g = ctx.createLinearGradient(s.x, s.y, s.x + Math.cos(s.a) * len, s.y - Math.sin(s.a) * len);
        g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.4; ctx.beginPath();
        ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + Math.cos(s.a) * len, s.y - Math.sin(s.a) * len); ctx.stroke();
      }
      // мягкий подсвет за курсором
      sx += (tsx - sx) * .12; sy += (tsy - sy) * .12;
      spot.style.transform = `translate3d(${sx}px,${sy}px,0)`;
    }
    requestAnimationFrame(frame);
  }
  const spot = $('.spot');
  addEventListener('resize', resize);
  addEventListener('pointermove', e => {
    tx = (e.clientX / W - .5) * -2; ty = (e.clientY / H - .5) * -2;
    tsx = e.clientX; tsy = e.clientY;
    const g = e.target.closest && e.target.closest('.glass');
    if (g) {
      const r = g.getBoundingClientRect();
      g.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      g.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }
  }, { passive: true });
  resize(); requestAnimationFrame(frame);

  /* ============ Появление при скролле ============ */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.04, rootMargin: '0px 0px 30px 0px' });
  $$('.rv').forEach(el => io.observe(el));

  /* ============ Счётчики ============ */
  const co = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, to = +el.dataset.count, dur = 1800, t0 = performance.now();
    const step = now => {
      const k = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 4)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step); co.unobserve(el);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => co.observe(el));

  /* ============ Профессии ============ */
  const JOBS = {
    out: {
      cap: 'Риск автоматизации',
      list: [
        ['Кассир и оператор ввода данных', 'Кассы самообслуживания уже стоят во многих магазинах, а документы распознаёт программа. Обычных вакансий тут будет всё меньше.', 90],
        ['Первая линия поддержки', 'Бот отвечает на «где мой заказ?» за секунду и без выходных. Живой человек остаётся для сложных и скандальных случаев.', 82],
        ['Банковский операционист', 'Большинство операций давно переехало в приложение. Отделений становится меньше, и это видно даже по своему району.', 78],
        ['Автор шаблонных текстов', 'Описания товаров, SEO-текст «на объём». Нейросеть делает такое за секунды. Останутся те, у кого есть свой голос.', 74]
      ]
    },
    mid: {
      cap: 'Риск автоматизации',
      list: [
        ['Программист', 'Код теперь пишут вдвоём с ассистентом. Набирать строчки ценится меньше, чем понимать, что вообще строим и почему оно сломалось.', 55],
        ['Бухгалтер', 'Первичку и сверки уже тянут программы. Растёт доля консультаций и разбора нестандартных ситуаций.', 60],
        ['Дизайнер', 'Картинку по описанию выдаст любая модель. Зато нужен тот, кто понимает бренд и аудиторию и может сказать «нет, не то».', 50],
        ['Юрист', 'Поиск по документам автоматизируется. Переговоры, суд и объяснить клиенту, что его ждёт, автоматизировать куда сложнее.', 45],
        ['Врач', 'ИИ уже помогает разбирать снимки. Говорить с пациентом и принимать решение под свою ответственность пока остаётся человеку.', 30]
      ]
    },
    up: {
      cap: 'Спрос растёт', warm: true,
      list: [
        ['Специалист по ИИ и машинному обучению', 'Кому-то же надо эти модели обучать, проверять и чинить. В списке самых быстрорастущих профессий у WEF они на первых местах.', 92],
        ['Аналитик данных', 'Данных становится больше, и вопросов к ним тоже. Нужен человек, который поймёт, какой вопрос вообще стоит задавать.', 85],
        ['Специалист по кибербезопасности', 'Чем больше всё оцифровано и чем умнее мошенники с нейросетями, тем нужнее защита.', 80],
        ['ИИ-интегратор', 'Не все компании понимают, куда им вставить нейросеть. Кто объяснит и настроит, тот нужен. Устоявшегося названия у профессии пока нет.', 75],
        ['Инженер возобновляемой энергетики', 'Дата-центрам нужна энергия, а переход на «зелёную» тоже никто не отменял. Тоже есть в быстрорастущих у WEF.', 70],
        ['Профессии заботы', 'Медсестра, соцработник, учитель. Население стареет, и человека рядом заменить сложнее всего.', 78]
      ]
    }
  };

  const cards = $('#cards'), tabs = $('#tabs'), ind = $('.ind', tabs);
  function placeInd() {
    const on = $('button.on', tabs);
    ind.style.width = on.offsetWidth + 'px';
    ind.style.transform = `translateX(${on.offsetLeft}px)`;
  }
  function showJobs(key) {
    const d = JOBS[key];
    cards.innerHTML = d.list.map((j, i) => `
      <article class="card glass" style="--i:${i}">
        <h3>${j[0]}</h3>
        <p>${j[1]}</p>
        <div class="meter ${d.warm ? 'warm' : ''}">
          <small><span>${d.cap}</span></small>
          <div class="tr"><i class="fl" style="--lvl:${j[2]}%"></i></div>
        </div>
      </article>`).join('');
  }
  let switchingJobs = false;
  tabs.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.classList.contains('on') || switchingJobs) return;
    $$('button', tabs).forEach(x => x.classList.toggle('on', x === b));
    placeInd();
    switchingJobs = true;
    cards.style.opacity = '0';
    cards.style.transform = 'translateY(8px)';
    setTimeout(() => {
      showJobs(b.dataset.tab);
      cards.style.opacity = '1';
      cards.style.transform = 'none';
      switchingJobs = false;
    }, 160);
  });
  showJobs('out'); document.fonts.ready.then(placeInd); addEventListener('resize', placeInd); placeInd();

  /* ============ Soft skills ============ */
  const SK = [
    ['Критическое мышление',
      'Нейросеть выдаёт ответ уверенным тоном, даже когда выдумывает. Кто-то должен заметить, что в нём дыра.',
      'Привыкни спрашивать себя «откуда это известно?». Хотя бы одну цифру из каждого ответа ИИ проверяй по источнику.'],
    ['Общение и эмпатия',
      'Модель напишет вежливое письмо, но она не сидит напротив расстроенного клиента и не видит, что человек сегодня на нервах. И отвечать за последствия всё равно людям.',
      'Любая работа с людьми: подработка в сервисе, волонтёрство, староста группы. Староста, кстати, отличный тренажёр по переговорам.'],
    ['Адаптивность',
      'Инструменты меняются каждые пару лет. Модель знает то, чему её учили, а человек может переучиться на ходу.',
      'Раз в квартал берись за что-то, в чём ты полный новичок. Неловкое чувство от этого и есть тренировка.'],
    ['Работа в команде',
      'Большие дела делаются группой, а в группе есть самолюбие, усталость и конфликты. Это нужно разруливать, и пока лучше всех это умеют люди.',
      'Командные проекты, хакатоны, групповые курсовые. И обязательно потом обсудить, что пошло не так.'],
    ['Творческое мышление',
      'Здесь спорно: модели уже умеют удивлять, так что считать творчество безопасной гаванью я бы не стал. Но выбрать из десяти вариантов тот, что подходит именно этой ситуации, пока остаётся за человеком.',
      'Делай что-то своё, без задания: канал, проект, музыку, что угодно. Вкус появляется только от практики.'],
    ['Ответственность',
      'Нейросеть не придёт на встречу, когда всё пошло плохо, и не подпишет документ. За результат отвечает человек, и компании за это платят.',
      'Доводи мелочи до конца: сдавай в срок и предупреждай заранее, если не успеваешь. Звучит скучно, но это работает.']
  ];
  const sl = $('#skillList'), sp = $('#skillPanel');
  sl.innerHTML = SK.map((s, i) => `<button data-i="${i}" class="${i ? '' : 'on'}">${s[0]}</button>`).join('');
  function showSkill(i) {
    const s = SK[i];
    sp.innerHTML = `<div class="in"><h3>${s[0]}</h3>
      <h4>Почему у робота тут проблемы</h4><p>${s[1]}</p>
      <h4>Как тренировать</h4><p>${s[2]}</p></div>`;
  }
  sl.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', sl).forEach(x => x.classList.toggle('on', x === b));
    showSkill(+b.dataset.i);
  });
  showSkill(0);

  /* ============ План ============ */
  const PLAN = [
    ['Прямо сейчас', [
      ['Пользоваться нейросетью каждый день, но проверять ответы', 'Для учёбы, конспектов, разбора непонятных тем. Главное правило: не принимать ответ на веру.'],
      ['Довести один инструмент по специальности до «могу показать»', 'Не десять по верхам, а один так, чтобы можно было сделать маленький проект и объяснить, как он устроен.'],
      ['Завести папку или страницу с работами', 'Пусть пока там три вещи. Начать собирать портфолио с первого курса гораздо проще, чем вспоминать всё перед выпуском.']
    ]],
    ['Середина учёбы', [
      ['Попасть на практику или стажировку', 'Хоть на пару месяцев и хоть за небольшие деньги. Реальные рабочие процессы ничем не заменить.'],
      ['Выступить публично с докладом или защитой проекта', 'Если страшно, значит, надо. Это как раз тот навык, который не скачивается.'],
      ['Поучаствовать в командном деле', 'Хакатон, олимпиада, волонтёрский проект. Тут тренируется то самое «договариваться с людьми».'],
      ['Подтянуть английский до «читаю документацию»', 'Большая часть новых инструментов сначала появляется на английском, и русские материалы идут с запозданием.']
    ]],
    ['Перед выпуском', [
      ['Собрать 2–3 настоящие работы в портфолио', 'С описанием: какая была задача, что сделал именно ты и что получилось.'],
      ['Решить, что дальше: работа или вуз', 'Вариантов много, в том числе вуз по сокращённой программе после колледжа. Главное, чтобы выбор был осознанным.'],
      ['Выработать привычку учиться дальше', 'Курс, книга, проект раз в квартал. Диплом нужен один раз, а переучиваться придётся много раз.']
    ]]
  ];
  const KEY = 'ai-work-plan-v1';
  let done = new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
  const total = PLAN.reduce((n, g) => n + g[1].length, 0);
  const pl = $('#planList');
  let id = 0;
  pl.innerHTML = PLAN.map(g => `
    <div class="group rv"><h3>${g[0]}</h3>
    ${g[1].map(it => { const k = id++; return `
      <button class="item glass" data-id="${k}" aria-pressed="false">
        <span class="box"><svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3.2L13 4.8"/></svg></span>
        <span><span class="t">${it[0]}</span><span class="d">${it[1]}</span></span>
      </button>`; }).join('')}
    </div>`).join('');
  $$('#planList .rv').forEach(el => io.observe(el));

  const ringFg = $('#ringFg'), ringNum = $('#ringNum'), ringMsg = $('#ringMsg');
  const C = 326.7;
  function renderPlan() {
    $$('.item', pl).forEach(b => {
      const on = done.has(+b.dataset.id);
      b.classList.toggle('done', on); b.setAttribute('aria-pressed', on);
    });
    const p = Math.round(done.size / total * 100);
    ringFg.style.strokeDashoffset = C * (1 - p / 100);
    ringNum.textContent = p + '%';
    ringMsg.textContent = p === 0 ? 'Пока пусто, но все с этого начинали'
      : p < 40 ? 'Начало положено'
      : p < 80 ? 'Уже неплохо идёшь'
      : p < 100 ? 'Почти всё, осталось чуть-чуть'
      : 'Всё. Можно составлять план на следующие десять лет';
  }
  pl.addEventListener('click', e => {
    const b = e.target.closest('.item'); if (!b) return;
    const k = +b.dataset.id;
    done.has(k) ? done.delete(k) : done.add(k);
    localStorage.setItem(KEY, JSON.stringify([...done]));
    renderPlan();
  });
  $('#reset').addEventListener('click', () => { done.clear(); localStorage.removeItem(KEY); renderPlan(); });
  renderPlan();

  /* ============ Мини-тест ============ */
  const s1 = $('#s1'), s2 = $('#s2'), s3 = $('#s3');
  function calc() {
    [[s1, 'o1'], [s2, 'o2'], [s3, 'o3']].forEach(([s, o]) => {
      $('#' + o).textContent = s.value;
      s.style.setProperty('--p', s.value + '%');
    });
    const sc = Math.round(s1.value * .5 + (100 - s2.value) * .2 + (100 - s3.value) * .3);
    $('#score').textContent = sc;
    $('#gauge').style.width = sc + '%';
    $('#verdict').textContent =
      sc < 25 ? 'Скорее спокойно. Но «безопасно» не значит «не меняется»: новые инструменты всё равно придётся осваивать.'
      : sc < 50 ? 'Умеренно. Часть задач уйдёт к ИИ, а ты, скорее всего, станешь тем, кто им управляет и проверяет результат.'
      : sc < 75 ? 'Заметный риск. Самое время добавить в работу больше общения и нестандартных задач.'
      : 'Горячо. Если работа почти вся из повторяющихся действий, ей, скорее всего, придётся измениться. Начни с плана выше.';
  }
  [s1, s2, s3].forEach(s => s.addEventListener('input', calc)); calc();

  /* ============ Навигация ============ */
  const bar = $('#progress');
  const links = $$('.links a');
  function onScroll() {
    const h = document.documentElement;
    bar.style.transform = `scaleX(${scrollY / (h.scrollHeight - innerHeight || 1)})`;
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const so = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => so.observe(s));

  /* ============ Анимированный favicon ============ */
  let fav = $('#favicon');
  const fc = document.createElement('canvas'); fc.width = fc.height = 64;
  const f = fc.getContext('2d');
  function drawFav(t) {
    f.clearRect(0, 0, 64, 64);
    // чёрный диск с тонкой кромкой
    const bg = f.createRadialGradient(32, 32, 4, 32, 32, 32);
    bg.addColorStop(0, '#1c1c1c'); bg.addColorStop(1, '#000');
    f.fillStyle = bg; f.beginPath(); f.arc(32, 32, 31, 0, 6.283); f.fill();
    f.strokeStyle = 'rgba(255,255,255,.28)'; f.lineWidth = 1.5; f.beginPath(); f.arc(32, 32, 30.5, 0, 6.283); f.stroke();

    const a = t * .004, pulse = 1 + Math.sin(t * .003) * .06;
    f.save(); f.translate(32, 32); f.rotate(-.45);
    const ring = (from, to) => { f.beginPath(); f.ellipse(0, 0, 26, 9.5, 0, from, to); f.stroke(); };
    f.strokeStyle = 'rgba(255,255,255,.55)'; f.lineWidth = 2;
    ring(Math.PI, Math.PI * 2);                       // дальняя часть орбиты
    const dx = Math.cos(a) * 26, dy = Math.sin(a) * 9.5;
    if (dy < 0) { f.fillStyle = '#ffe2b8'; f.beginPath(); f.arc(dx, dy, 3.2, 0, 6.283); f.fill(); }
    f.restore();

    // планета
    const pg = f.createRadialGradient(27, 26, 1, 32, 32, 13 * pulse);
    pg.addColorStop(0, '#ffffff'); pg.addColorStop(.6, '#9a9a9a'); pg.addColorStop(1, '#3a3a3a');
    f.shadowColor = 'rgba(255,255,255,.7)'; f.shadowBlur = 8;
    f.fillStyle = pg; f.beginPath(); f.arc(32, 32, 12 * pulse, 0, 6.283); f.fill();
    f.shadowBlur = 0;

    f.save(); f.translate(32, 32); f.rotate(-.45);
    f.strokeStyle = 'rgba(255,255,255,.9)'; f.lineWidth = 2;
    ring(0, Math.PI);                                 // ближняя часть орбиты
    if (dy >= 0) { f.fillStyle = '#ffe2b8'; f.shadowColor = '#ffe2b8'; f.shadowBlur = 6; f.beginPath(); f.arc(dx, dy, 3.6, 0, 6.283); f.fill(); }
    f.restore();
  }
  function tickFav() {
    drawFav(performance.now());
    const n = fav.cloneNode();
    n.type = 'image/png'; n.href = fc.toDataURL('image/png');
    fav.replaceWith(n); fav = n;
  }
  if (!RM) setInterval(tickFav, 110); else tickFav();
  tickFav();

  /* ============ Заголовок вкладки ============ */
  const title = document.title;
  addEventListener('blur', () => document.title = 'Вернись, мы ещё не всё рассказали');
  addEventListener('focus', () => document.title = title);
})();

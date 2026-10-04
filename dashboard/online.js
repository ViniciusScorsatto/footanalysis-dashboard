if (window.FOOT_ANALYSIS_ONLINE) {
  document.body.classList.add('online-dashboard');
  document.querySelector('#open-preview-link').textContent = 'Abrir prévia';
  document.querySelector('#preview-frame').title = 'Prévia do vídeo';
  const comparison = document.createElement('section');comparison.className='panel';comparison.hidden=true;
  const comparisonTitle=document.createElement('h3');comparisonTitle.textContent='Comparativo';comparison.append(comparisonTitle);
  const comparisonNote=document.createElement('p');comparisonNote.textContent='Use os IDs API-Sports. Prepare tabelas/artilheiros das ligas primeiro para alimentar o banco online vazio.';comparison.append(comparisonNote);
  const fields={};
  for(const [name,label] of [['left','ID do primeiro time ou liga'],['right','ID do segundo time ou liga'],['leagueIds','IDs das ligas para artilheiros (separados por vírgula)']]) {
    const field=document.createElement('label');field.textContent=label;
    const input=document.createElement('input');input.type='text';input.inputMode=name==='leagueIds'?'text':'numeric';fields[name]=input;field.append(input);comparison.append(field);
  }
  document.querySelector('#job-form').prepend(comparison);
  const template=document.querySelector('#template');
  const showComparison=()=>{comparison.hidden=!template.value.endsWith('-comparison');};
  template.addEventListener('change',showComparison);
  new MutationObserver(showComparison).observe(template,{childList:true});
  window.onlineComparisonPayload=()=>({leftTeamId:Number(fields.left.value),rightTeamId:Number(fields.right.value),leftLeagueId:Number(fields.left.value),rightLeagueId:Number(fields.right.value),leagueIds:fields.leagueIds.value});
  const nav = document.querySelector('.dashboard-top-nav');
  const logout = document.createElement('form');
  logout.method = 'POST'; logout.action = '/auth/logout';
  const button = document.createElement('button');button.textContent = 'Sair';button.className = 'btn btn-secondary';logout.append(button);
  const panel = document.createElement('section');panel.className = 'panel online-renders';panel.id='video-settings';
  const settingsLink=document.createElement('a');settingsLink.href='#videos';settingsLink.className='back-link';settingsLink.textContent='Meus vídeos';nav.append(settingsLink);
  const storageLink=document.createElement('a');storageLink.href='#settings';storageLink.className='back-link';storageLink.textContent='Configurações';nav.append(storageLink,logout);
  const heading = document.createElement('h2');heading.textContent = 'Meus vídeos';
  const summary=document.createElement('p');summary.className='storage-summary';summary.textContent='Consultando armazenamento…';
  const feedback=document.createElement('p');feedback.className='storage-feedback';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
  const removeAll=document.createElement('button');removeAll.type='button';removeAll.className='btn btn-secondary danger-action';removeAll.textContent='Excluir todos os MP4';removeAll.disabled=true;
  const deletionNote=document.createElement('p');deletionNote.className='storage-note';deletionNote.textContent='MP4 disponíveis por 48 horas. Excluir libera espaço e preserva os dados para gerar novamente.';
  const header=document.createElement('div');header.className='studio-videos-header';
  const headerCopy=document.createElement('div');headerCopy.append(heading,summary);header.append(headerCopy,removeAll);
  const columns=document.createElement('div');columns.className='studio-video-columns';columns.setAttribute('aria-hidden','true');
  for(const label of ['Vídeo','Criado em','Estado','Tamanho','Ações']) {const cell=document.createElement('span');cell.textContent=label;columns.append(cell);}
  const list = document.createElement('div');panel.append(header,deletionNote,feedback,columns,list);
  let storageFiles=0, busy=false, refreshing=false;
  let currentView='create', lastStorageAt=0, lastRenderAt=0, activeRenders=false, listSignature='';
  const formatBytes=(bytes)=>bytes<1024?`${bytes} B`:bytes<1024**2?`${(bytes/1024).toFixed(1)} KB`:bytes>=1024**3?`${(bytes/1024**3).toFixed(2)} GB`:`${(bytes/1024**2).toFixed(2)} MB`;
  let pageIndex=0;
  const previous=document.createElement('button'),next=document.createElement('button');
  previous.textContent='Mais recentes';next.textContent='Mais antigos';
  for(const b of [previous,next]) {b.className='btn btn-secondary';panel.append(b);}
  previous.onclick=()=>{pageIndex=Math.max(0,pageIndex-1);void refresh(true);};
  next.onclick=()=>{pageIndex++;void refresh(true);};
  document.querySelector('.log-panel').before(panel);
  const settings=document.createElement('section');settings.className='panel online-renders';settings.id='online-settings';
  const settingsHeading=document.createElement('h2');settingsHeading.textContent='Configurações';
  const settingsDescription=document.createElement('p');settingsDescription.textContent='Dashboard privado · acesso somente pela conta Google autorizada.';
  const retention=document.createElement('p');retention.textContent='Armazenamento: os MP4 expiram 48 horas após a conclusão. Os dados dos vídeos são mantidos para gerar novamente.';
  const settingsStorage=document.createElement('p');settingsStorage.textContent='Consultando armazenamento…';
  const manage=document.createElement('a');manage.href='#videos';manage.className='btn btn-secondary';manage.textContent='Gerenciar vídeos e liberar espaço';
  settings.append(settingsHeading,settingsDescription,retention,settingsStorage,manage);panel.after(settings);
  const createLink=document.querySelector('.studio-create-link');
  const showView=()=>{
    const view=location.hash==='#settings'?'settings':['#videos','#video-settings'].includes(location.hash)?'videos':'create';
    currentView=view;
    document.querySelector('#job-form').hidden=view!=='create';
    document.querySelector('.log-panel').hidden=view!=='create';
    panel.hidden=view!=='videos';settings.hidden=view!=='settings';
    for(const [link,name] of [[createLink,'create'],[settingsLink,'videos'],[storageLink,'settings']]) link.setAttribute('aria-current',view===name?'page':'false');
    const target=view==='settings'?settingsHeading:view==='videos'?heading:document.querySelector('.command-title h1');
    target.tabIndex=-1;target.focus({preventScroll:true});window.scrollTo(0,0);
    void refresh(true);
  };
  window.addEventListener('hashchange',showView);showView();
  const states = {queued: 'Na fila', rendering: 'Renderizando', completed: 'Pronto', failed: 'Falhou', cancelled: 'Cancelado'};
  async function action(url, method = 'POST') {
    const response = await fetch(url, {method});
    if (!response.ok) throw new Error('Não foi possível executar a ação.');
  }
  removeAll.onclick=async()=>{
    if(busy || !window.confirm(`Excluir todos os ${storageFiles} MP4 armazenados, incluindo páginas anteriores? Os arquivos serão removidos; os dados serão mantidos para gerar novamente. Renders em andamento não serão afetados.`)) return;
    busy=true;removeAll.disabled=true;
    try {
      const response=await fetch('/api/online/renders',{method:'DELETE',headers:{'X-Confirm-Delete':'all-completed-mp4'}});
      if(!response.ok) throw new Error('Não foi possível excluir todos os arquivos. Atualize e tente novamente.');
      const result=await response.json();feedback.textContent=`${result.deleted} MP4 excluídos · ${formatBytes(result.freedBytes)} liberados. Dados preservados.`;
    } catch(error) {feedback.textContent=error.message;}
    finally {busy=false;listSignature='';await refresh(true);}
  };
  function addAction(card, text, url, method) {
    const b = document.createElement('button');b.textContent = text;b.className = `btn btn-secondary${method==='DELETE'?' danger-action':''}`;
    b.onclick = async () => {
      if(busy || (method==='DELETE' && !window.confirm('Excluir este MP4 para liberar espaço? Os dados serão mantidos para gerar novamente.'))) return;
      busy=true;b.disabled=true;removeAll.disabled=true;
      try {await action(url,method);feedback.textContent=method==='DELETE'?'MP4 excluído. Dados preservados para gerar novamente.':'Ação realizada.';}
      catch(e) {feedback.textContent=e.message;}
      finally {busy=false;listSignature='';await refresh(true);}
    };
    card.append(b);
  }
  async function refresh(force=false) {
    if (document.hidden || currentView==='create' || busy || refreshing) return;
    const needStorage=force || Date.now()-lastStorageAt>=30000;
    const needRenders=currentView==='videos' && (force || Date.now()-lastRenderAt>=(activeRenders?5000:30000));
    if (!needStorage && !needRenders) return;
    const requestedView=currentView, requestedPage=pageIndex;
    refreshing=true;
    try {
      const [response,storageResponse]=await Promise.all([
        needRenders?fetch(`/api/online/renders?page=${requestedPage}`):null,
        needStorage?fetch('/api/online/storage'):null,
      ]);
      if ([response,storageResponse].some(r=>r?.status===401)) {feedback.textContent=settingsStorage.textContent='Sessão expirada. Entre novamente pela página inicial.';removeAll.disabled=true;return;}
      if ([response,storageResponse].some(r=>r && !r.ok)) throw new Error('Falha ao consultar vídeos.');
      if (storageResponse) {
        const {storage}=await storageResponse.json();lastStorageAt=Date.now();
        storageFiles=storage.files;summary.textContent=`${storage.files} MP4 armazenados · ${formatBytes(storage.bytes)} em vídeos (todas as páginas)`;settingsStorage.textContent=summary.textContent;removeAll.disabled=busy || storage.files===0;
      }
      if (requestedView!==currentView || requestedPage!==pageIndex) {queueMicrotask(()=>refresh(true));return;}
      if (!response) return;
      const {renders,activeCount}=await response.json();lastRenderAt=Date.now();
      activeRenders=activeCount>0 || renders.some(row=>['queued','rendering'].includes(row.state));
      const signature=JSON.stringify([requestedPage,renders]);
      if(signature===listSignature) return;
      listSignature=signature;
      previous.disabled=pageIndex===0;next.disabled=renders.length<100;
      list.replaceChildren();
      if (!renders.length) {list.textContent = 'Nenhum vídeo criado ainda.';return;}
      for (const row of renders) {
        const card = document.createElement('article');card.className = 'online-render';card.dataset.state=row.deleted_at?'deleted':row.state;
        const info=document.createElement('div');info.className='render-info';
        const actions=document.createElement('div');actions.className='render-actions';
        const title = document.createElement('strong');title.textContent = row.title;
        const status = document.createElement('p');status.textContent = `${row.state==='completed' && row.deleted_at ? 'MP4 removido' : states[row.state]}${row.state === 'rendering' ? ` · ${Math.round(row.progress * 100)}%` : ''}`;
        status.className='render-state';
        const created=document.createElement('p');created.textContent=new Date(row.created_at).toLocaleString();created.className='render-created';
        const size=document.createElement('p');size.textContent=row.sizeBytes?formatBytes(row.sizeBytes):'—';size.className='render-size';
        info.append(title);card.append(info,created,status,size,actions);
        if (row.error) {const error=document.createElement('p');error.textContent=row.error;info.append(error);}
        const base = `/api/online/renders/${row.id}`;
        if (row.downloadUrl) {
          const link = document.createElement('a');link.href=row.downloadUrl;link.textContent='Baixar MP4';link.className='btn btn-primary';actions.append(link);
          const play = document.createElement('a');play.href=`${row.downloadUrl}?inline=1`;play.target='_blank';play.rel='noopener';play.textContent='Reproduzir';play.className='btn btn-secondary';actions.append(play);
          const expiry = document.createElement('p');expiry.className='render-detail';expiry.textContent=`Disponível até ${new Date(row.expires_at).toLocaleString()}`;info.append(expiry);
        } else if (row.state === 'completed') {const expired=document.createElement('p');expired.className='render-detail';expired.textContent='MP4 expirado ou excluído. Dados preservados.';info.append(expired);}
        if(row.state==='completed' && !row.deleted_at && row.sizeBytes>0) addAction(actions,'Excluir MP4',base,'DELETE');
        if (['queued','rendering'].includes(row.state)) addAction(actions,'Cancelar',`${base}/cancel`);
        else addAction(actions,'Gerar novamente',`${base}/retry`);
        list.append(card);
      }
    } catch {feedback.textContent='Sem conexão. Tentaremos atualizar novamente; o render continua no servidor.';removeAll.disabled=true;}
    finally {refreshing=false;}
  }
  setInterval(()=>refresh(),5000);
  window.addEventListener('online-render-update',()=>{lastStorageAt=0;lastRenderAt=0;void refresh(true);});
  document.addEventListener('visibilitychange',()=>refresh(true));
}

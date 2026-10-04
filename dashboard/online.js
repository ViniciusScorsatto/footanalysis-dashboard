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
  const button = document.createElement('button');button.textContent = 'Sair';button.className = 'btn btn-secondary';logout.append(button);nav.append(logout);
  const panel = document.createElement('section');panel.className = 'panel online-renders';panel.id='video-settings';
  const settingsLink=document.createElement('a');settingsLink.href='#video-settings';settingsLink.className='btn btn-secondary';settingsLink.textContent='Settings · Meus vídeos';nav.append(settingsLink);
  const heading = document.createElement('h2');heading.textContent = 'Settings · Meus vídeos e armazenamento';
  const note = document.createElement('p');note.textContent = 'Um render por vez. MP4 disponíveis por 48 horas após ficarem prontos. Você pode fechar a página e voltar depois.';
  const summary=document.createElement('p');summary.textContent='Consultando armazenamento…';
  const feedback=document.createElement('p');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
  const removeAll=document.createElement('button');removeAll.type='button';removeAll.className='btn btn-secondary';removeAll.textContent='Excluir todos os MP4';removeAll.disabled=true;
  const deletionNote=document.createElement('p');deletionNote.textContent='A exclusão libera espaço dos MP4. Histórico, dados, músicas e renders em andamento são preservados. Você pode gerar novamente.';
  const list = document.createElement('div');panel.append(heading,note,summary,removeAll,deletionNote,feedback,list);
  let storageFiles=0, busy=false, refreshing=false;
  const formatBytes=(bytes)=>bytes<1024?`${bytes} B`:bytes<1024**2?`${(bytes/1024).toFixed(1)} KB`:bytes>=1024**3?`${(bytes/1024**3).toFixed(2)} GB`:`${(bytes/1024**2).toFixed(2)} MB`;
  let pageIndex=0;
  const previous=document.createElement('button'),next=document.createElement('button');
  previous.textContent='Mais recentes';next.textContent='Mais antigos';
  for(const b of [previous,next]) {b.className='btn btn-secondary';panel.append(b);}
  previous.onclick=()=>{pageIndex=Math.max(0,pageIndex-1);void refresh();};
  next.onclick=()=>{pageIndex++;void refresh();};
  document.querySelector('.shell').append(panel);
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
    finally {busy=false;await refresh();}
  };
  function addAction(card, text, url, method) {
    const b = document.createElement('button');b.textContent = text;b.className = 'btn btn-secondary';
    b.onclick = async () => {
      if(busy || (method==='DELETE' && !window.confirm('Excluir este MP4 para liberar espaço? Os dados serão mantidos para gerar novamente.'))) return;
      busy=true;b.disabled=true;removeAll.disabled=true;
      try {await action(url,method);feedback.textContent=method==='DELETE'?'MP4 excluído. Dados preservados para gerar novamente.':'Ação realizada.';}
      catch(e) {feedback.textContent=e.message;}
      finally {busy=false;await refresh();}
    };
    card.append(b);
  }
  async function refresh() {
    if (document.hidden || busy || refreshing) return;
    refreshing=true;
    try {
      const response = await fetch(`/api/online/renders?page=${pageIndex}`);
      if (response.status === 401) {note.textContent = 'Sessão expirada. Entre novamente pela página inicial.';return;}
      if (!response.ok) throw new Error('Falha ao consultar vídeos.');
      const {renders} = await response.json();
      const storageResponse=await fetch('/api/online/storage');
      if(!storageResponse.ok) throw new Error('Falha ao consultar armazenamento.');
      const {storage}=await storageResponse.json();
      storageFiles=storage.files;summary.textContent=`${storage.files} MP4 armazenados · ${formatBytes(storage.bytes)} em vídeos (todas as páginas)`;removeAll.disabled=busy || storage.files===0;
      previous.disabled=pageIndex===0;next.disabled=renders.length<100;
      list.replaceChildren();
      if (!renders.length) {list.textContent = 'Nenhum vídeo criado ainda.';return;}
      for (const row of renders) {
        const card = document.createElement('article');card.className = 'online-render';
        const title = document.createElement('strong');title.textContent = row.title;
        const status = document.createElement('p');status.textContent = `${row.state==='completed' && row.deleted_at ? 'MP4 removido' : states[row.state]}${row.state === 'rendering' ? ` · ${Math.round(row.progress * 100)}%` : ''}`;
        card.append(title,status);
        const metadata=document.createElement('p');metadata.textContent=`Criado em ${new Date(row.created_at).toLocaleString()} · ${row.template}${row.sizeBytes ? ` · ${formatBytes(row.sizeBytes)}` : ''}`;card.append(metadata);
        if (row.error) {const error=document.createElement('p');error.textContent=row.error;card.append(error);}
        const base = `/api/online/renders/${row.id}`;
        if (row.downloadUrl) {
          const link = document.createElement('a');link.href=row.downloadUrl;link.textContent='Baixar MP4';link.className='btn btn-primary';card.append(link);
          const play = document.createElement('a');play.href=`${row.downloadUrl}?inline=1`;play.target='_blank';play.rel='noopener';play.textContent='Reproduzir';play.className='btn btn-secondary';card.append(play);
          const expiry = document.createElement('p');expiry.textContent=`Disponível até ${new Date(row.expires_at).toLocaleString()}`;card.append(expiry);
        } else if (row.state === 'completed') {const expired=document.createElement('p');expired.textContent='MP4 expirado ou excluído. Os dados continuam disponíveis para gerar novamente.';card.append(expired);}
        if(row.state==='completed' && !row.deleted_at && row.sizeBytes>0) addAction(card,'Excluir MP4',base,'DELETE');
        if (['queued','rendering'].includes(row.state)) addAction(card,'Cancelar',`${base}/cancel`);
        else addAction(card,'Gerar novamente',`${base}/retry`);
        list.append(card);
      }
    } catch {feedback.textContent='Sem conexão. Tentaremos atualizar novamente; o render continua no servidor.';removeAll.disabled=true;}
    finally {refreshing=false;}
  }
  setInterval(refresh,5000);
  window.addEventListener('online-render-update',refresh);
  document.addEventListener('visibilitychange',refresh);
  void refresh();
}

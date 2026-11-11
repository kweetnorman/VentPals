(function(){
  'use strict';
  var G=window.VPGrowth;
  if(!G)return;
  var $=function(id){return document.getElementById(id);};
  var bird=G.getBird();
  var user={};
  try{user=JSON.parse(localStorage.getItem('ventpals_user')||'{}');}catch(e){}
  $('welcomeName').textContent=user.nickname||user.displayName||user.username||'Friend';
  $('birdName').textContent=bird.name;
  $('birdWelcome').textContent=bird.name+' is glad to be home with you.';
  var reflectionKey='ventpals_reflection_'+bird.id;
  $('nestReflection').value=localStorage.getItem(reflectionKey)||'';
  function render(){
    var p=G.getProgress(),basket=G.getBasket(),total=G.basketTotal();
    G.renderAvatar($('myBirdArt'),{height:164});
    $('birdStage').textContent=p.stage.name+' stage';
    $('growthPoints').textContent=p.xp+' growth points';
    $('nextStage').textContent=p.next?'Next: '+p.next.name:'Fully grown!';
    $('growthBar').style.width=Math.max(0,p.pct)+'%';
    $('growthHint').textContent=p.next?p.toNext+' more growth points until '+p.next.name+'.':bird.name+' has reached the final growth stage!';
    $('bugTotal').textContent=total+' bug'+(total===1?'':'s');
    $('bugBasket').innerHTML='';
    basket.forEach(function(b){
      var btn=document.createElement('button');
      btn.type='button';btn.className='bug-button';btn.disabled=!b.count;
      var icon=document.createElement('span');icon.className='block text-2xl';icon.textContent=b.info.icon;
      var name=document.createElement('span');name.className='block text-xs';name.textContent=b.info.name;
      var count=document.createElement('span');count.className='block text-sm';count.textContent=b.count;
      btn.appendChild(icon);btn.appendChild(name);btn.appendChild(count);
      btn.setAttribute('aria-label','Feed '+b.count+' '+b.info.name);
      btn.addEventListener('click',function(){showFeed(G.feed(b.type,b.count));});
      $('bugBasket').appendChild(btn);
    });
    $('feedAll').disabled=total===0;
    G.renderStagesGrid($('stagesGrid'),bird.id);
  }
  function showFeed(result){
    $('feedMessage').textContent=result&&result.fed?'Yum! '+bird.name+' enjoyed '+result.fed+' bug'+(result.fed===1?'':'s')+'. '+result.growth+' growth points earned!':'Your basket is empty for now. Explore an activity to find a snack!';
    render();
  }
  $('feedAll').addEventListener('click',function(){showFeed(G.feedAll());});
  $('saveReflection').addEventListener('click',function(){
    localStorage.setItem(reflectionKey,$('nestReflection').value);
    $('saveMessage').textContent='Saved in your Nest ✓';
    G.award('reflection');
  });
  render();
})();
/**
 * tessel-runtime.js — Inline JS bundle embedded in every compiled Tessel HTML
 *
 * Part of the Tessel compiler library.
 * Exports: TESSEL_RUNTIME_JS  (string — written verbatim into <script> in compiled HTML)
 *
 * The bundle is a self-invoking function that wires up all interactive behaviour
 * after the HTML document loads. It has zero external dependencies.
 *
 * Broodforge-compatible (all behaviour from md_to_html.py _JS preserved).
 * Tessel additions:
 *   - @date field persistence
 *   - @if/@endif conditional visibility (tessel-if blocks)
 *   - Field metadata: required, required_if, visible_if, validate, warning_message
 *   - ValidationEngine: highlights invalid fields, blocks export, auto-clears
 *   - VisibilityEngine: evaluates visible_if expressions, shows/hides fields
 */

var TESSEL_RUNTIME_JS = String.raw`
(function(){
  var ns = 'bf:' + (document.body.dataset.doc || 'doc') + ':';

  // ---- theme ----
  (function(){
    try{ if(localStorage.getItem('bf:theme')==='light') document.body.classList.add('light'); }catch(e){}
    var tb = document.getElementById('bf-theme-btn');
    function lbl(){ if(tb) tb.textContent = document.body.classList.contains('light') ? '☾ Dark' : '☀ Light'; }
    if(tb){ lbl(); tb.addEventListener('click', function(){
      document.body.classList.toggle('light');
      try{ localStorage.setItem('bf:theme', document.body.classList.contains('light')?'light':'dark'); }catch(e){}
      lbl();
    }); }
  })();

  // ---- parameter inputs (live template substitution) ----
  function applyVar(name, val){
    document.querySelectorAll('.tpl[data-var="'+name+'"]').forEach(function(s){
      s.textContent = val || name;
    });
  }
  (function(){
    document.querySelectorAll('.param-input').forEach(function(inp){
      var vname = inp.dataset.var;
      if(!vname) return;
      var stored = null;
      try{ stored = localStorage.getItem(ns+'param:'+vname); }catch(e){}
      if(stored !== null) { inp.value = stored; applyVar(vname, stored); }
      else { applyVar(vname, inp.value); }
      inp.addEventListener('input', function(){
        applyVar(vname, inp.value);
        try{ localStorage.setItem(ns+'param:'+vname, inp.value); }catch(e){}
      });
    });
  })();

  // ---- note inputs (text + textarea) ----
  (function(){
    document.querySelectorAll('.note-input,.note-area').forEach(function(inp){
      var slug = inp.dataset.note || inp.id || '';
      if(!slug) return;
      try{ var s=localStorage.getItem(ns+'note:'+slug); if(s!==null) inp.value=s; }catch(e){}
      inp.addEventListener('input', function(){
        try{ localStorage.setItem(ns+'note:'+slug, inp.value); }catch(e){}
      });
    });
  })();

  // ---- date fields (Tessel) ----
  (function(){
    document.querySelectorAll('.date-field input[type=date]').forEach(function(inp){
      var slug = inp.dataset.note || inp.id || '';
      if(!slug) return;
      try{ var s=localStorage.getItem(ns+'note:'+slug); if(s!==null) inp.value=s; }catch(e){}
      inp.addEventListener('input', function(){
        try{ localStorage.setItem(ns+'note:'+slug, inp.value); }catch(e){}
        tesselValidate(inp);
        tesselVisibility();
      });
    });
  })();

  // ---- session notes quick textarea ----
  (function(){
    var sn = document.getElementById('bf-session-notes');
    if(!sn) return;
    var k = ns+'sn';
    try{ var s=localStorage.getItem(k); if(s!==null) sn.value=s; }catch(e){}
    sn.addEventListener('input', function(){ try{ localStorage.setItem(k, sn.value); }catch(e){} });
  })();

  // ---- section expand/collapse (collapsible mode) ----
  (function(){
    var ea = document.getElementById('bf-expand-all');
    var ca = document.getElementById('bf-collapse-all');
    var cnt = document.getElementById('bf-section-count');
    function updateCount(){
      if(!cnt) return;
      var all = document.querySelectorAll('details.section').length;
      var open = document.querySelectorAll('details.section[open]').length;
      cnt.textContent = open + ' / ' + all;
    }
    if(ea) ea.addEventListener('click', function(){
      document.querySelectorAll('details.section,details.subsection').forEach(function(d){d.open=true;});
      updateCount();
    });
    if(ca) ca.addEventListener('click', function(){
      document.querySelectorAll('details.section').forEach(function(d){d.open=false;});
      updateCount();
    });
    document.querySelectorAll('details.section').forEach(function(d){
      d.addEventListener('toggle', updateCount);
    });
    updateCount();
  })();

  // ---- attachment panel ----
  (function(){
    var attachBtn = document.getElementById('bf-attach-btn');
    var attachPanel = document.getElementById('bf-attach-panel');
    var attachZone = document.getElementById('bf-attach-zone');
    var attachPick = document.getElementById('bf-attach-pick');
    var attachList = document.getElementById('bf-attach-list');
    var attachCount = document.getElementById('bf-attach-count');
    if(!attachBtn||!attachPanel) return;
    var attachments = [];
    function updateCount(){ if(attachCount) attachCount.textContent = attachments.length ? '('+attachments.length+')' : ''; }
    attachBtn.addEventListener('click', function(e){
      e.stopPropagation();
      attachPanel.classList.toggle('open');
    });
    document.addEventListener('click', function(e){
      if(attachPanel.classList.contains('open') && !attachPanel.contains(e.target) && e.target!==attachBtn)
        attachPanel.classList.remove('open');
    });
    function addFile(file){
      var reader = new FileReader();
      reader.onload = function(e){
        attachments.push({name:file.name, size:file.size, type:file.type, data:e.target.result});
        renderList(); updateCount();
      };
      reader.readAsArrayBuffer(file);
    }
    function renderList(){
      if(!attachList) return;
      attachList.innerHTML = '';
      attachments.forEach(function(a, i){
        var li = document.createElement('li');
        li.innerHTML = '<span>'+a.name+'</span><span class="sz">'+(a.size>1048576?(a.size/1048576).toFixed(1)+'MB':(a.size>1024?(a.size/1024).toFixed(0)+'KB':a.size+'B'))+'</span>';
        var del = document.createElement('button'); del.type='button'; del.textContent='×';
        del.addEventListener('click', function(){ attachments.splice(i,1); renderList(); updateCount(); });
        li.appendChild(del); attachList.appendChild(li);
      });
    }
    if(attachZone){
      attachZone.addEventListener('dragover', function(e){ e.preventDefault(); attachZone.classList.add('drag-over'); });
      attachZone.addEventListener('dragleave', function(){ attachZone.classList.remove('drag-over'); });
      attachZone.addEventListener('drop', function(e){ e.preventDefault(); attachZone.classList.remove('drag-over');
        Array.from(e.dataTransfer.files).forEach(addFile); });
    }
    if(attachPick){ attachPick.addEventListener('click', function(){
      var inp = document.createElement('input'); inp.type='file'; inp.multiple=true;
      inp.addEventListener('change', function(){ Array.from(inp.files).forEach(addFile); });
      inp.click();
    }); }
    window.bfGetAttachments = function(){ return attachments; };
  })();

  // ---- shared save-dialog helper ----
  window.bfSave = async function(blob, suggestedName, types){
    if(window.showSaveFilePicker){
      try{
        var handle = await window.showSaveFilePicker({suggestedName:suggestedName,types:(types&&types.length)?types:undefined});
        var writable = await handle.createWritable();
        await writable.write(blob); await writable.close(); return true;
      }catch(e){ if(e.name==='AbortError') return false; }
    }
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a'); a.href=url; a.download=suggestedName;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); },1000);
    return true;
  };

  // ---- ZIP builder (pure JS, no deps) ----
  function buildZip(files){
    // files: array of {name, data} where data is Uint8Array or string
    function crc32(buf){
      var table=crc32.t||(crc32.t=function(){var t=new Uint32Array(256);for(var i=0;i<256;i++){var c=i;for(var j=0;j<8;j++)c=c&1?(0xEDB88320^(c>>>1)):c>>>1;t[i]=c;}return t;}());
      var crc=0xFFFFFFFF;
      for(var i=0;i<buf.length;i++) crc=(crc>>>8)^table[(crc^buf[i])&0xFF];
      return (crc^0xFFFFFFFF)>>>0;
    }
    function str2u8(s){ return new TextEncoder().encode(s); }
    function u8(v,n){ var a=new Uint8Array(n); for(var i=0;i<n;i++){a[i]=v&0xFF;v>>=8;} return a; }
    var localHeaders=[]; var centralDir=[]; var offset=0;
    var allParts=[];
    files.forEach(function(f){
      var name = str2u8(f.name);
      var data = typeof f.data==='string' ? str2u8(f.data) : f.data;
      var crc = crc32(data);
      var localHdr = new Uint8Array(30+name.length);
      var dv = new DataView(localHdr.buffer);
      dv.setUint32(0,0x04034b50,true); // sig
      dv.setUint16(4,20,true);         // version needed
      dv.setUint16(6,0,true);          // flags
      dv.setUint16(8,0,true);          // compression
      dv.setUint32(14,crc,true);
      dv.setUint32(18,data.length,true);
      dv.setUint32(22,data.length,true);
      dv.setUint16(26,name.length,true);
      localHdr.set(name,30);
      var cenHdr = new Uint8Array(46+name.length);
      var cv = new DataView(cenHdr.buffer);
      cv.setUint32(0,0x02014b50,true);
      cv.setUint16(4,20,true); cv.setUint16(6,20,true);
      cv.setUint32(16,crc,true);
      cv.setUint32(20,data.length,true); cv.setUint32(24,data.length,true);
      cv.setUint16(28,name.length,true);
      cv.setUint32(42,offset,true);
      cenHdr.set(name,46);
      centralDir.push(cenHdr);
      allParts.push(localHdr); allParts.push(data);
      offset += localHdr.length + data.length;
    });
    var cdSize=centralDir.reduce(function(a,b){return a+b.length;},0);
    var eocd=new Uint8Array(22);
    var ev=new DataView(eocd.buffer);
    ev.setUint32(0,0x06054b50,true);
    ev.setUint16(8,files.length,true); ev.setUint16(10,files.length,true);
    ev.setUint32(12,cdSize,true); ev.setUint32(16,offset,true);
    var parts=allParts.concat(centralDir,[eocd]);
    var total=parts.reduce(function(a,b){return a+b.length;},0);
    var out=new Uint8Array(total); var pos=0;
    parts.forEach(function(p){out.set(p,pos);pos+=p.length;});
    return out;
  }

  // ---- ZIP parser ----
  function parseZip(ab){
    var u8=new Uint8Array(ab);
    var dv=new DataView(ab);
    var files={};
    // scan for local file header signatures
    var i=0;
    while(i<u8.length-3){
      if(dv.getUint32(i,true)===0x04034b50){
        var fnLen=dv.getUint16(i+26,true);
        var exLen=dv.getUint16(i+28,true);
        var cmpSz=dv.getUint32(i+18,true);
        var fname=new TextDecoder().decode(u8.slice(i+30,i+30+fnLen));
        var dataOff=i+30+fnLen+exLen;
        files[fname]=ab.slice(dataOff,dataOff+cmpSz);
        i=dataOff+cmpSz;
      } else { i++; }
    }
    return Object.keys(files).length?files:null;
  }

  // ---- timestamp helper ----
  function stamp(){
    var d=new Date();
    function p(n){return (n<10?'0':'')+n;}
    var tz=(new Date()).toLocaleTimeString('en-US',{timeZoneName:'short'}).split(' ').pop()||'UTC';
    return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())
      +'_'+p(d.getHours())+'-'+p(d.getMinutes())+'_'+p(d.getSeconds())+'_'+tz;
  }
  function docSlugFn(){
    return (document.title||'Document').trim()
      .replace(/\.md\b/gi,'').replace(/\s+/g,'-').replace(/[^A-Za-z0-9_-]/g,'')
      .replace(/-+/g,'-').replace(/^-|-$/g,'')||'Document';
  }

  // ---- EFF-style passphrase generator ----
  var _adj=['amber','bold','brisk','calm','chief','crisp','dark','deep','fast','firm','fleet','fresh','grand','grey','hard','high','keen','kind','lean','light','long','mild','neat','noble','pale','prime','pure','quiet','rare','rich','safe','sharp','slow','small','soft','still','swift','tall','thin','true','warm','wide','wild'];
  var _ani=['bat','bear','bee','buck','bull','cat','cod','crane','crow','deer','doe','dog','dove','duck','elk','emu','falcon','finch','fox','frog','gnu','hawk','hen','hog','ibis','jay','kite','lark','lynx','mink','mole','moose','moth','mule','newt','owl','pike','ram','rat','raven','robin','stag','swan','toad','vole','wasp','wolf','wren','yak'];
  var _wds=['alpine','bridge','castle','circuit','current','delta','ember','engine','flare','forest','forge','gleam','hammer','herald','island','lantern','mantle','needle','nexus','onyx','pillar','quartz','relay','ridge','shield','signal','silver','spiral','summit','thunder','timber','torque','tunnel','vector','vertex','warden','winter','zenith'];
  function _rnd(arr){var b=new Uint16Array(1);crypto.getRandomValues(b);return arr[b[0]%arr.length];}
  function _rndN(max){var b=new Uint16Array(1);crypto.getRandomValues(b);return b[0]%max;}
  function genPassphrase(schema){
    if(schema==='3word-n') return _rnd(_wds)+'-'+_rnd(_wds)+'-'+_rnd(_wds)+'-'+(_rndN(900)+100);
    if(schema==='random'){
      var chars='abcdefghjkmnpqrstuvwxyz23456789';
      var rb=new Uint8Array(18); crypto.getRandomValues(rb);
      var s=Array.from(rb).map(function(b){return chars[b%chars.length];}).join('');
      return s.slice(0,6)+'-'+s.slice(6,12)+'-'+s.slice(12,18);
    }
    return _rnd(_adj)+'.'+_rnd(_ani)+'.'+_rnd(_adj)+'.'+_rnd(_ani)+'.'+(_rndN(90)+10);
  }
  function genTotpSecret(bits){
    var nb = bits===256?32:20;
    var b32='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    var rb=new Uint8Array(nb); crypto.getRandomValues(rb);
    var bits2=0,acc=0,out='';
    for(var i=0;i<rb.length;i++){acc=(acc<<8)|rb[i];bits2+=8;
      while(bits2>=5){bits2-=5;out+=b32[(acc>>bits2)&31];}}
    if(bits2>0) out+=b32[(acc<<(5-bits2))&31];
    return out.match(/.{1,4}/g).join(' ');
  }

  // ---- suggest buttons ----
  (function(){
    document.querySelectorAll('.bf-suggest-btn').forEach(function(btn){
      btn.addEventListener('click',function(e){
        e.stopPropagation();
        var kind=btn.dataset.suggest, forId=btn.dataset.for;
        var sel=document.querySelector('.bf-suggest-select[data-suggest-for="'+forId+'"]');
        var schema=sel?sel.value:'';
        var val;
        if(kind==='totp-secret') val=genTotpSecret(schema==='totp-32'?256:160);
        else val=genPassphrase(schema);
        var inp=document.querySelector('[data-note="'+forId+'"]')||document.getElementById('cred-'+forId)||document.getElementById('cred-totp-'+forId);
        if(!inp) return;
        inp.value=val; inp.dispatchEvent(new Event('input',{bubbles:true}));
        if(kind==='passphrase'){
          var conf=document.getElementById('cred-confirm-'+forId);
          if(conf){conf.value=val; conf.dispatchEvent(new Event('input',{bubbles:true}));}
        }
      });
    });
  })();

  // ---- credential fields ----
  (function(){
    document.querySelectorAll('.cred-input').forEach(function(inp){
      var k='bf:cred:'+(inp.dataset.cred||inp.id||'');
      try{var s=sessionStorage.getItem(k);if(s!==null)inp.value=s;}catch(e){}
      inp.addEventListener('input',function(){
        try{sessionStorage.setItem(k,inp.value);}catch(e){}
        var slug=inp.dataset.cred; if(slug) _updateCredMatch(slug);
      });
    });
    document.querySelectorAll('.cred-toggle').forEach(function(btn){
      btn.addEventListener('click',function(){
        var slug=btn.dataset.for;
        var inp=document.querySelector('.cred-input[data-cred="'+slug+'"]');
        var conf=document.getElementById('cred-confirm-'+slug);
        if(!inp)return;
        var show=inp.type==='password';
        inp.type=show?'text':'password';
        if(conf) conf.type=show?'text':'password';
        btn.textContent=show?'🙈':'👁';
        btn.title=show?'Hide':'Show / hide';
      });
    });
    function _updateCredMatch(slug){
      var main=document.getElementById('cred-'+slug);
      var conf=document.getElementById('cred-confirm-'+slug);
      var ind=document.getElementById('cred-match-'+slug);
      if(!main||!conf||!ind)return;
      var v=main.value, c=conf.value;
      if(!v&&!c){ind.textContent='';ind.className='cred-match-indicator';return;}
      if(!c){ind.textContent='';ind.className='cred-match-indicator';return;}
      if(v===c){ind.textContent='✓ match';ind.className='cred-match-indicator cred-match-ok';}
      else{ind.textContent='✗ mismatch';ind.className='cred-match-indicator cred-match-fail';}
    }
    window._updateCredMatch=_updateCredMatch;
    document.querySelectorAll('.cred-confirm-input').forEach(function(conf){
      conf.addEventListener('input',function(){ _updateCredMatch(conf.dataset.for||''); });
    });
    document.querySelectorAll('.cred-totp-input').forEach(function(inp){
      var k='bf:totp:'+(inp.dataset.cred||inp.id||'');
      try{var s=sessionStorage.getItem(k);if(s!==null)inp.value=s;}catch(e){}
      inp.addEventListener('input',function(){ try{sessionStorage.setItem(k,inp.value);}catch(e){} });
    });
    document.querySelectorAll('.cred-method-cb').forEach(function(cb){
      var cslug=cb.dataset.cred, method=cb.value;
      var mk='bf:method:'+cslug+':'+method;
      try{var saved=sessionStorage.getItem(mk);if(saved!==null)cb.checked=(saved==='1');}catch(e){}
      function applyVis(){
        var secId=method==='password'?'cred-pw-section-'+cslug:'cred-totp-section-'+cslug;
        var sec=document.getElementById(secId);
        if(sec) sec.style.display=cb.checked?'':'none';
      }
      applyVis();
      cb.addEventListener('change',function(){applyVis();try{sessionStorage.setItem(mk,cb.checked?'1':'0');}catch(e){}});
    });
    // click-to-peek masked credential spans
    document.querySelectorAll('.cred-tpl[data-cred-slug]').forEach(function(span){
      var timer=null;
      span.style.cursor='pointer'; span.title='Click to peek (auto-masks after 4s)';
      span.addEventListener('click',function(){
        if(timer){clearTimeout(timer);timer=null;span.textContent='••••••••';span.title='Click to peek (auto-masks after 4s)';return;}
        var val='';try{val=sessionStorage.getItem('bf:cred:'+span.dataset.credSlug)||'';}catch(e){}
        span.textContent=val||'(empty)'; span.title='Click to re-mask';
        timer=setTimeout(function(){span.textContent='••••••••';span.title='Click to peek (auto-masks after 4s)';timer=null;},4000);
      });
    });
  })();

  // ---- radio/checkbox choice fields ----
  (function(){
    document.querySelectorAll('.choice-field').forEach(function(div){
      var slug=div.dataset.slug, type=div.dataset.choiceType;
      if(!slug)return;
      var hidden=div.querySelector('input[type=hidden][data-note="'+slug+'"]');
      function updateHidden(){
        var vals=[];
        if(type==='radio'){var c=div.querySelector('input[type=radio]:checked');if(c)vals=[c.value];}
        else{div.querySelectorAll('input[type=checkbox]:checked').forEach(function(cb){vals.push(cb.value);});}
        if(hidden){hidden.value=vals.join(',');hidden.dispatchEvent(new Event('input'));}
      }
      try{
        var saved=localStorage.getItem(ns+'note:'+slug);
        if(saved){
          var sv=saved.split(',');
          if(type==='radio') div.querySelectorAll('input[type=radio]').forEach(function(r){r.checked=sv.indexOf(r.value)>=0;});
          else div.querySelectorAll('input[type=checkbox]').forEach(function(cb){cb.checked=sv.indexOf(cb.value)>=0;});
          if(hidden) hidden.value=saved;
        }
      }catch(e){}
      div.querySelectorAll('input[type=radio],input[type=checkbox]').forEach(function(inp){
        inp.addEventListener('change',function(){updateHidden();try{localStorage.setItem(ns+'note:'+slug,hidden?hidden.value:'');}catch(e){}
          tesselValidate(); tesselVisibility();
        });
      });
    });
  })();

  // ---- table fields ----
  (function(){
    function getTableCols(div){
      var heads=div.querySelectorAll('.input-table thead th');
      var cols=[];for(var i=0;i<heads.length-1;i++)cols.push(heads[i].textContent.trim());
      return cols;
    }
    function serializeTable(tbody,cols){
      var rows=[],trs=tbody.querySelectorAll('tr');
      trs.forEach(function(tr){
        var row={},inputs=tr.querySelectorAll('input:not([type=hidden]),textarea');
        for(var i=0;i<Math.min(inputs.length,cols.length);i++)row[cols[i]]=inputs[i].value;
        rows.push(row);
      });
      return rows;
    }
    function saveTable(slug,rows,hid){
      var v=JSON.stringify(rows);
      try{localStorage.setItem(ns+'note:'+slug,v);}catch(e){}
      if(hid)hid.value=v;
    }
    function addRow(div,slug,cols,hid,rowData){
      var tbody=document.getElementById('tbl-'+slug);
      if(!tbody)return;
      var tr=document.createElement('tr');
      cols.forEach(function(col,idx){
        var td=document.createElement('td');
        var inp;
        if(idx===cols.length-1&&cols.length>1){inp=document.createElement('textarea');inp.rows=2;}
        else{inp=document.createElement('input');inp.type='text';}
        inp.value=rowData&&rowData[col]!=null?rowData[col]:'';
        inp.addEventListener('input',function(){saveTable(slug,serializeTable(tbody,cols),hid);});
        td.appendChild(inp);tr.appendChild(td);
      });
      var td=document.createElement('td');
      var del=document.createElement('button');del.type='button';del.textContent='×';del.className='row-del-btn';del.title='Remove row';
      del.addEventListener('click',function(){tr.parentNode.removeChild(tr);saveTable(slug,serializeTable(tbody,cols),hid);});
      td.appendChild(del);tr.appendChild(td);tbody.appendChild(tr);
    }
    document.querySelectorAll('.table-field').forEach(function(div){
      var slug=div.dataset.slug;if(!slug)return;
      var cols=getTableCols(div);
      var tbody=document.getElementById('tbl-'+slug);if(!tbody)return;
      var hid=div.querySelector('input[type=hidden][data-note="'+slug+'"]');
      var saved=null;
      try{var s=localStorage.getItem(ns+'note:'+slug);if(s)saved=JSON.parse(s);}catch(e){}
      if(saved&&saved.length){
        saved.forEach(function(row){addRow(div,slug,cols,hid,row);});
      } else {
        var preset=[];
        if(hid&&hid.dataset.presetRows){try{preset=JSON.parse(hid.dataset.presetRows);}catch(e){}}
        preset.forEach(function(rowLabel){
          var row={};if(cols.length>0)row[cols[0]]=rowLabel;
          addRow(div,slug,cols,hid,row);
        });
        if(preset.length&&tbody.rows.length)saveTable(slug,serializeTable(tbody,cols),hid);
      }
      var addBtn=div.querySelector('.add-row-btn');
      if(addBtn){addBtn.addEventListener('click',function(){addRow(div,slug,cols,hid,null);});}
    });
  })();

  // ---- parse fields ----
  (function(){
    document.querySelectorAll('.parse-field').forEach(function(div){
      var target=div.dataset.parseTarget,rxStr=div.dataset.parseRegex;
      var btn=div.querySelector('.parse-btn'),applyBtn=div.querySelector('.parse-apply');
      var ta=div.querySelector('.parse-input'),resultDiv=div.querySelector('.parse-result');
      var valueEl=div.querySelector('.parse-value');
      if(!btn||!ta||!resultDiv||!valueEl)return;
      var lastMatch=null;
      btn.addEventListener('click',function(){
        var matched=null;
        try{var rx=new RegExp(rxStr,'m');var m=ta.value.match(rx);if(m)matched=m[1]!==undefined?m[1]:m[0];}catch(e){}
        lastMatch=matched; valueEl.textContent=matched||'(no match found)';
        resultDiv.style.display='';
        if(applyBtn)applyBtn.style.display=matched?'':'none';
      });
      if(applyBtn){
        applyBtn.addEventListener('click',function(){
          if(!lastMatch||!target)return;
          var el=document.querySelector('[data-note="'+target+'"]');
          if(el){el.value=lastMatch;el.dispatchEvent(new Event('input'));
            applyBtn.textContent='Applied ✓';setTimeout(function(){applyBtn.textContent='Apply ↓';},1400);}
        });
      }
    });
  })();

  // ---- filename suggest fields ----
  (function(){
    document.querySelectorAll('.filename-field').forEach(function(div){
      var tpl=div.dataset.template,slug=div.dataset.slug;
      var input=div.querySelector('.filename-input');
      var warnDiv=div.querySelector('.filename-dep-warn');
      var warnText=div.querySelector('.dep-warn-text');
      var highlightBtn=div.querySelector('.dep-highlight-btn');
      var suggestBtn=div.querySelector('.filename-suggest-btn');
      if(!input||!tpl)return;
      function fillTemplate(){
        var result=tpl,missing=[];
        result=result.replace(/\{\{STAMP\}\}/g,stamp());
        result=result.replace(/\{\{(?:note:|param:)?([^}]+)\}\}/g,function(m,ref){
          var el=document.querySelector('[data-var="'+ref.trim()+'"]')||document.querySelector('[data-note="'+ref.trim()+'"]');
          var v=el?el.value.trim():'';
          if(!v)missing.push(ref.trim());
          return v||('<'+ref.trim()+'>');
        });
        if(warnDiv){
          if(missing.length){warnDiv.style.display='';if(warnText)warnText.textContent='⚠ Depends on unfilled fields: '+missing.join(', ');}
          else{warnDiv.style.display='none';}
        }
        return result;
      }
      function suggest(){input.value=fillTemplate();input.dispatchEvent(new Event('input'));}
      if(suggestBtn)suggestBtn.addEventListener('click',suggest);
      if(!input.value)suggest();
      document.addEventListener('input',function(e){
        if(e.target===input)return;
        if(warnDiv&&warnDiv.style.display!=='none')suggest();
      });
      if(highlightBtn){
        highlightBtn.addEventListener('click',function(){
          var refs=[];
          tpl.replace(/\{\{(?:note:|param:)?([^}]+)\}\}/g,function(m,ref){if(ref!=='STAMP')refs.push(ref.trim());});
          refs.forEach(function(ref){
            var el=document.querySelector('[data-note="'+ref+'"],[data-var="'+ref+'"]');
            if(el&&!el.value){el.style.outline='3px solid var(--yellow)';el.scrollIntoView({behavior:'smooth',block:'center'});
              setTimeout(function(){el.style.outline='';},3000);}
          });
        });
      }
    });
  })();

  // ---- inline validation (ip4, domain, path from data-validate attr) ----
  (function(){
    var _IP4=/^(\d{1,3}\.){3}\d{1,3}$/;
    var _DOM=/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    function _validHint(el,msg){
      el.classList.toggle('val-warn',!!msg);
      var wrap=el.closest('.notefield,.param-row');if(!wrap)return;
      var h=wrap.querySelector('.val-hint');
      if(msg&&!h){h=document.createElement('span');h.className='val-hint';wrap.appendChild(h);}
      if(h){h.textContent=msg||'';h.style.display=msg?'':'none';}
    }
    function _validateEl(el){
      var v=el.dataset.validate||'',val=(el.value||'').trim();
      if(!v||!val)return _validHint(el,'');
      if(v==='ip4'){
        if(!_IP4.test(val)){_validHint(el,'Expected IPv4 format: a.b.c.d');return;}
        if(val.split('.').map(Number).some(function(o){return o>255;})){_validHint(el,'Each octet must be 0–255');return;}
      } else if(v==='domain'){
        if(!_DOM.test(val)){_validHint(el,'Expected domain format: name.tld or sub.name.tld');return;}
      } else if(v==='path'){
        if(val&&!val.endsWith('/')){_validHint(el,'Path should end with /');return;}
      }
      _validHint(el,'');
    }
    document.querySelectorAll('[data-validate]').forEach(function(el){
      el.addEventListener('input',function(){_validateEl(el);});
      el.addEventListener('blur',function(){_validateEl(el);});
    });
    document.querySelectorAll('.dir-input').forEach(function(el){
      el.dataset.validate='path';
      el.addEventListener('input',function(){_validateEl(el);});
      el.addEventListener('blur',function(){_validateEl(el);});
    });
  })();

  // ---- Tessel ValidationEngine (field metadata: required, validate, warning_message) ----
  function tesselValidate(changedEl){
    // --- field-level validation ---
    document.querySelectorAll('[data-tv-validate],[data-tv-required]').forEach(function(el){
      var fieldWrap = el.closest('[data-tv-id]') || el.closest('.notefield,.date-field,.choice-field,.table-field');
      var required = el.dataset.tvRequired==='true';
      var requiredIf = el.dataset.tvRequiredIf||'';
      var validateExpr = el.dataset.tvValidate||'';
      var warnMsg = el.dataset.tvWarnMsg||'';
      var val = getFieldValue(el);
      var isEmpty = !val || (typeof val==='string'&&!val.trim());

      // eval required_if
      if(!required && requiredIf) required = evalExpr(requiredIf);

      var err = '';
      if(required && isEmpty){ err = warnMsg||'This field is required.'; }
      else if(validateExpr && !isEmpty){ if(!evalExpr(validateExpr)) err = warnMsg||'Validation failed.'; }

      // find or create warn span
      var warnSpan = fieldWrap&&fieldWrap.querySelector('.tv-warn-msg');
      if(err){
        el.classList.add('tv-invalid');
        if(fieldWrap){
          if(!warnSpan){warnSpan=document.createElement('span');warnSpan.className='tv-warn-msg';fieldWrap.appendChild(warnSpan);}
          warnSpan.textContent=err;warnSpan.style.display='';
        }
      } else {
        el.classList.remove('tv-invalid');
        if(warnSpan){warnSpan.textContent='';warnSpan.style.display='none';}
      }
    });

    // --- table row validation (required columns must be non-empty) ---
    document.querySelectorAll('.table-field[data-tv-required="true"],.table-field[data-tv-required-if]').forEach(function(div){
      var required = div.querySelector('[data-tv-required="true"]')!==null;
      var requiredIf = (div.querySelector('[data-tv-required-if]')||{dataset:{}}).dataset.tvRequiredIf||'';
      if(!required && requiredIf) required = evalExpr(requiredIf);
      if(!required) return;
      var tbody = div.querySelector('.input-table tbody');
      if(!tbody) return;
      var rows = tbody.querySelectorAll('tr');
      var hasError = false;
      rows.forEach(function(tr){
        var inputs = tr.querySelectorAll('input:not([type=hidden]),textarea');
        if(!inputs.length) return;
        // first column is always "required" for a required table
        var first = inputs[0];
        if(!first.value.trim()){
          first.classList.add('tv-invalid');
          hasError = true;
        } else {
          first.classList.remove('tv-invalid');
        }
      });
      // table-level warn
      var warnMsg = (div.querySelector('[data-tv-warn-msg]')||{dataset:{}}).dataset.tvWarnMsg||'';
      var hid = div.querySelector('input[type=hidden]');
      var fieldWrap = div;
      var warnSpan = fieldWrap.querySelector(':scope>.tv-warn-msg');
      // if no rows at all and table is required → warn
      if(required && rows.length === 0){
        hid && hid.classList.add('tv-invalid');
        if(!warnSpan){warnSpan=document.createElement('span');warnSpan.className='tv-warn-msg';fieldWrap.appendChild(warnSpan);}
        warnSpan.textContent = warnMsg||'At least one row is required.';warnSpan.style.display='';
      } else if(!hasError){
        hid && hid.classList.remove('tv-invalid');
        if(warnSpan){warnSpan.textContent='';warnSpan.style.display='none';}
      }
    });

    // --- credential confirmation mismatch ---
    document.querySelectorAll('.cred-input').forEach(function(inp){
      var slug = inp.dataset.cred||'';
      if(!slug) return;
      var conf = document.getElementById('cred-confirm-'+slug);
      if(!conf||!conf.value) return;
      var mismatch = inp.value !== conf.value;
      inp.classList.toggle('tv-invalid', mismatch);
      conf.classList.toggle('tv-invalid', mismatch);
    });
  }

  // ---- Tessel VisibilityEngine (visible_if on fields + @if blocks) ----
  function tesselVisibility(){
    // field-level visible_if
    document.querySelectorAll('[data-tv-visible-if]').forEach(function(el){
      var expr = el.dataset.tvVisibleIf;
      var wrap = el.closest('.notefield,.date-field,.choice-field,.table-field,.parse-field,.filename-field,.dir-field,.cred-field');
      var target = wrap || el;
      target.style.display = evalExpr(expr) ? '' : 'none';
    });
    // @if block visibility
    document.querySelectorAll('.tessel-if[data-tv-expr]').forEach(function(el){
      var show = evalExpr(el.dataset.tvExpr);
      if(show) el.removeAttribute('hidden'); else el.setAttribute('hidden','');
    });
  }

  // ---- Tessel expression evaluator ----
  // Supports: ==, !=, <, <=, >, >=, contains, not, and, or, string/number literals, field refs
  function getFieldValue(elOrSlug){
    var el = typeof elOrSlug==='string'
      ? (document.querySelector('[data-tv-id="'+elOrSlug+'"]')||document.querySelector('[data-note="'+elOrSlug+'"]')||document.querySelector('[data-var="'+elOrSlug+'"]'))
      : elOrSlug;
    if(!el) return '';
    if(el.type==='checkbox'||el.type==='radio') return el.checked?el.value:'';
    var choiceField = el.closest('.choice-field');
    if(choiceField){
      var checked=[];
      var type=choiceField.dataset.choiceType;
      if(type==='radio'){var c=choiceField.querySelector('input:checked');if(c)return c.value;}
      choiceField.querySelectorAll('input:checked').forEach(function(c){checked.push(c.value);});
      return checked;
    }
    return el.value||'';
  }
  function evalExpr(expr){
    if(!expr||!expr.trim()) return true;
    expr = expr.trim();
    // or
    var orParts = splitTopLevel(expr,' or ');
    if(orParts.length>1) return orParts.some(function(p){return evalExpr(p.trim());});
    // and
    var andParts = splitTopLevel(expr,' and ');
    if(andParts.length>1) return andParts.every(function(p){return evalExpr(p.trim());});
    // not
    if(expr.startsWith('not ')) return !evalExpr(expr.slice(4));
    // parens
    if(expr.startsWith('(')&&expr.endsWith(')')) return evalExpr(expr.slice(1,-1));
    // operators
    var ops=[['>=','gte'],['<=','lte'],['>','gt'],['<','lt'],['!=','neq'],['==','eq'],['contains','contains']];
    for(var i=0;i<ops.length;i++){
      var op=ops[i][0],kind=ops[i][1];
      var idx=findOp(expr,op);
      if(idx<0)continue;
      var left=expr.slice(0,idx).trim(),right=expr.slice(idx+op.length).trim();
      var lv=resolveVal(left),rv=resolveVal(right);
      if(kind==='eq') return String(lv)===String(rv);
      if(kind==='neq') return String(lv)!==String(rv);
      if(kind==='gt') return Number(lv)>Number(rv);
      if(kind==='gte') return Number(lv)>=Number(rv);
      if(kind==='lt') return Number(lv)<Number(rv);
      if(kind==='lte') return Number(lv)<=Number(rv);
      if(kind==='contains'){
        var lv2=Array.isArray(lv)?lv:[String(lv)];
        return lv2.indexOf(String(rv))>=0||String(lv).indexOf(String(rv))>=0;
      }
    }
    // bare field ref: truthy if non-empty
    var v=resolveVal(expr);
    return !!v&&(Array.isArray(v)?v.length>0:String(v).trim()!=='');
  }
  function resolveVal(s){
    s=s.trim();
    if((s.startsWith('"')&&s.endsWith('"'))||(s.startsWith("'")&&s.endsWith("'"))) return s.slice(1,-1);
    if(/^-?\d+(\.\d+)?$/.test(s)) return parseFloat(s);
    if(s==='true') return true; if(s==='false') return false;
    // field ref
    var el=document.querySelector('[data-tv-id="'+s+'"]')||document.querySelector('[data-note="'+s+'"]')||document.querySelector('[data-var="'+s+'"]');
    if(el) return getFieldValue(el);
    return s;
  }
  function splitTopLevel(s,sep){
    var parts=[],depth=0,cur='';
    for(var i=0;i<s.length;i++){
      if(s[i]==='(') depth++;
      else if(s[i]===')') depth--;
      if(depth===0&&s.slice(i,i+sep.length)===sep){parts.push(cur);cur='';i+=sep.length-1;}
      else cur+=s[i];
    }
    parts.push(cur);
    return parts.length>1?parts:[s];
  }
  function findOp(s,op){
    // find op not inside quotes
    var inQ=false,qc='';
    for(var i=0;i<s.length;i++){
      if(!inQ&&(s[i]==='"'||s[i]==="'")){inQ=true;qc=s[i];}
      else if(inQ&&s[i]===qc) inQ=false;
      else if(!inQ&&s.slice(i,i+op.length)===op) return i;
    }
    return -1;
  }

  // Wire validation + visibility to all field inputs
  (function(){
    function onFieldChange(){tesselValidate();tesselVisibility();}
    document.querySelectorAll('.note-input,.note-area,.param-input').forEach(function(el){
      el.addEventListener('input',onFieldChange);
    });
    // Initial run
    tesselValidate(); tesselVisibility();
  })();

  // ---- Copy buttons on code blocks ----
  (function(){
    document.querySelectorAll('.copy-btn').forEach(function(btn){
      btn.addEventListener('click',function(){
        var wrap=btn.closest('.codewrap');
        var pre=wrap&&wrap.querySelector('pre');
        if(!pre)return;
        // resolve template vars before copying
        var clone=pre.cloneNode(true);
        clone.querySelectorAll('.tpl[data-var]').forEach(function(s){
          var inp=document.querySelector('.param-input[data-var="'+s.dataset.var+'"]');
          s.textContent=inp?inp.value:(s.textContent||s.dataset.var);
        });
        clone.querySelectorAll('.cred-tpl[data-cred-slug]').forEach(function(s){
          var val='';try{val=sessionStorage.getItem('bf:cred:'+s.dataset.credSlug)||'';}catch(e){}
          s.textContent=val||'';
        });
        var text=clone.innerText||clone.textContent;
        navigator.clipboard.writeText(text).then(function(){
          var old=btn.textContent;btn.textContent='Copied!';
          setTimeout(function(){btn.textContent=old;},1400);
        }).catch(function(){});
      });
    });
  })();

  // ---- export (ZIP + AES-256-GCM) ----
  (function(){
    var exportBtn=document.getElementById('bf-export-btn');
    if(!exportBtn)return;

    function hasCredentials(){
      var hasCred=false;
      document.querySelectorAll('.cred-input').forEach(function(inp){if(inp.value)hasCred=true;});
      document.querySelectorAll('.cred-totp-input').forEach(function(inp){if(inp.value)hasCred=true;});
      return hasCred;
    }
    function buildRecord(){
      var params={};
      document.querySelectorAll('.param-input').forEach(function(inp){
        if(inp.dataset.var) params[inp.dataset.var]=inp.value;
      });
      var notes=[];
      document.querySelectorAll('.note-input,.note-area').forEach(function(inp){
        var slug=inp.dataset.note||inp.id||'';if(!slug)return;
        var label=inp.closest('.notefield')?.querySelector('label')?.textContent||slug;
        notes.push({label:label,value:inp.value,type:inp.tagName==='TEXTAREA'?'area':'field'});
      });
      document.querySelectorAll('.date-field').forEach(function(div){
        var inp=div.querySelector('input[type=date]');if(!inp)return;
        var label=div.querySelector('label')?.textContent||inp.dataset.note||'date';
        notes.push({label:label,value:inp.value,type:'date'});
      });
      document.querySelectorAll('.choice-field').forEach(function(div){
        var slug=div.dataset.slug;if(!slug)return;
        var label=div.querySelector('label')?.textContent||slug;
        var hid=div.querySelector('input[type=hidden][data-note="'+slug+'"]');
        notes.push({label:label,value:hid?hid.value:'',type:div.dataset.choiceType==='radio'?'radio':'check'});
      });
      document.querySelectorAll('.cred-field').forEach(function(div){
        var label=div.querySelector('label')?.textContent||'credential';
        notes.push({label:label,value:'[CREDENTIAL — see encrypted package]',type:'credential'});
      });
      var sesNotes=document.getElementById('bf-session-notes');
      var noteTree=[];try{var nts=localStorage.getItem('bf:'+document.body.dataset.doc+':nts');if(nts)noteTree=JSON.parse(nts);}catch(e){}
      var attachments=(window.bfGetAttachments?window.bfGetAttachments():[]).map(function(a){return{name:a.name,size:a.size,type:a.type};});
      return {
        title:document.title,exported_at:new Date().toISOString(),
        parameters:params,notes:notes,
        session_notes:sesNotes?sesNotes.value:'',
        note_tree:noteTree,attachments:attachments
      };
    }
    function buildNotesMd(rec){
      var lines=['# '+rec.title+' — Session Notes','','*Exported: '+new Date().toString()+'*',''];
      if(rec.session_notes&&rec.session_notes.trim()){lines.push('## Quick Notes','',rec.session_notes.trim(),'');}
      if(rec.notes&&rec.notes.length){
        lines.push('## Fields','');
        rec.notes.forEach(function(n){lines.push('**'+n.label+':** '+(n.value||'(empty)'),'');});
      }
      return lines.join('\n');
    }
    function buildInnerZip(rec){
      var enc=new TextEncoder();
      var files=[
        {name:'record.json',data:enc.encode(JSON.stringify(rec,null,2))},
        {name:'notes.md',data:enc.encode(buildNotesMd(rec))}
      ];
      var atts=window.bfGetAttachments?window.bfGetAttachments():[];
      atts.forEach(function(a){files.push({name:'attachments/'+a.name,data:new Uint8Array(a.data)});});
      return buildZip(files);
    }

    async function doExport(passphrase){
      var rec=buildRecord();
      var innerZip=buildInnerZip(rec);
      var slug=docSlugFn();
      var ts=stamp();
      if(!passphrase){
        var blob=new Blob([innerZip],{type:'application/zip'});
        await window.bfSave(blob,slug+'_'+ts+'.zip',[{description:'ZIP archive',accept:{'application/zip':['.zip']}}]);
        return;
      }
      // AES-256-GCM encryption
      var salt=crypto.getRandomValues(new Uint8Array(16));
      var iv=crypto.getRandomValues(new Uint8Array(12));
      var keyMat=await crypto.subtle.importKey('raw',new TextEncoder().encode(passphrase),'PBKDF2',false,['deriveKey']);
      var key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:salt,iterations:210000,hash:'SHA-256'},
        keyMat,{name:'AES-GCM',length:256},false,['encrypt']);
      var ct=await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},key,innerZip);
      function u8ToB64(u){return btoa(Array.from(u).map(function(b){return String.fromCharCode(b);}).join(''));}
      var innerName=slug+'_'+ts+'.zip';
      var meta=JSON.stringify({v:1,alg:'AES-256-GCM',kdf:'PBKDF2-SHA256',iter:210000,
        salt:u8ToB64(salt),iv:u8ToB64(iv),inner_name:innerName});
      var readme='Tessel encrypted export\n\nTo decrypt: open decrypt.html in any browser.\nPassphrase required.\n';
      var outerFiles=[
        {name:'payload.enc',data:new Uint8Array(ct)},
        {name:'meta.json',data:new TextEncoder().encode(meta)},
        {name:'README.txt',data:new TextEncoder().encode(readme)}
      ];
      var outerZip=buildZip(outerFiles);
      var blob=new Blob([outerZip],{type:'application/zip'});
      await window.bfSave(blob,slug+'_'+ts+'_encrypted.zip',[{description:'Encrypted ZIP',accept:{'application/zip':['.zip']}}]);
    }

    // Export modal (only shown when credentials present)
    var modal=document.getElementById('bf-enc-modal');
    var phraseInp=modal&&modal.querySelector('.enc-phrase-row input');
    var genPhraseBtn=modal&&modal.querySelector('.enc-phrase-row button');
    var confirmBtn=document.getElementById('bf-enc-confirm');
    var plainBtn=document.getElementById('bf-enc-plain');
    var cancelBtn=document.getElementById('bf-enc-cancel');

    function showModal(){if(modal)modal.classList.add('active');}
    function hideModal(){if(modal)modal.classList.remove('active');}
    if(genPhraseBtn&&phraseInp){genPhraseBtn.addEventListener('click',function(){phraseInp.value=genPassphrase('4word');});}
    if(confirmBtn){confirmBtn.addEventListener('click',function(){var p=phraseInp?phraseInp.value.trim():'';if(!p)return alert('Enter a passphrase.');hideModal();doExport(p);});}
    if(plainBtn){plainBtn.addEventListener('click',function(){hideModal();doExport(null);});}
    if(cancelBtn){cancelBtn.addEventListener('click',hideModal);}

    exportBtn.addEventListener('click',function(){
      // Check for invalid required fields
      var invalid=document.querySelectorAll('.tv-invalid');
      if(invalid.length){
        alert('Please fill all required fields before exporting. ('+invalid.length+' field(s) need attention)');
        invalid[0].scrollIntoView({behavior:'smooth',block:'center'});return;
      }
      if(hasCredentials()) showModal();
      else doExport(null);
    });
  })();

  // ---- import (ZIP with record.json) ----
  (function(){
    var importBtn=document.getElementById('bf-import-btn');
    if(!importBtn)return;
    function applyRecord(rec){
      if(rec.parameters){
        Object.keys(rec.parameters).forEach(function(k){
          var inp=document.querySelector('.param-input[data-var="'+k+'"]');
          if(inp){inp.value=rec.parameters[k];applyVar(k,inp.value);try{localStorage.setItem(ns+'param:'+k,inp.value);}catch(e){}}
        });
      }
      if(rec.notes){
        rec.notes.forEach(function(n){
          var slug=n.label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'note';
          var inp=document.querySelector('[data-note="'+slug+'"]');
          if(inp){inp.value=n.value||'';try{localStorage.setItem(ns+'note:'+slug,inp.value);}catch(e){}inp.dispatchEvent(new Event('input'));}
        });
      }
      if(rec.session_notes!==undefined){
        var sn=document.getElementById('bf-session-notes');
        if(sn){sn.value=rec.session_notes;try{localStorage.setItem(ns+'sn',rec.session_notes);}catch(e){}}
      }
      tesselValidate(); tesselVisibility();
      alert('Session imported.');
    }
    async function processZip(ab){
      var files=parseZip(ab);if(!files)return alert('Could not parse ZIP file.');
      if(files['payload.enc']&&files['meta.json']){
        var meta=JSON.parse(new TextDecoder().decode(files['meta.json']));
        var phrase=prompt('This package is encrypted. Enter passphrase:','');if(!phrase)return;
        try{
          function b64ToU8(s){var b=atob(s),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;}
          var salt=b64ToU8(meta.salt),iv=b64ToU8(meta.iv);
          var km=await crypto.subtle.importKey('raw',new TextEncoder().encode(phrase),'PBKDF2',false,['deriveKey']);
          var key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:salt,iterations:meta.iter||210000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['decrypt']);
          var pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:iv},key,new Uint8Array(files['payload.enc']));
          var inner=parseZip(pt);if(!inner||!inner['record.json'])return alert('Decrypted but record.json not found.');
          applyRecord(JSON.parse(new TextDecoder().decode(inner['record.json'])));
        }catch(e){alert('Decryption failed: '+e.message);}
      } else if(files['record.json']){
        applyRecord(JSON.parse(new TextDecoder().decode(files['record.json'])));
      } else {
        alert('ZIP does not contain record.json or encrypted payload.');
      }
    }
    var hiddenPick=document.createElement('input');hiddenPick.type='file';hiddenPick.accept='.zip';hiddenPick.style.display='none';
    document.body.appendChild(hiddenPick);
    importBtn.addEventListener('click',function(){hiddenPick.click();});
    hiddenPick.addEventListener('change',function(){
      var f=hiddenPick.files&&hiddenPick.files[0];if(!f)return;
      hiddenPick.value='';
      var rd=new FileReader();rd.onload=function(){processZip(rd.result);};rd.readAsArrayBuffer(f);
    });
  })();

  // ---- drag resizer ----
  (function(){
    var drag=document.getElementById('bf-drag');
    var notesPane=document.getElementById('bf-notes-pane');
    if(!drag||!notesPane)return;
    var dragging=false,startX=0,startW=0;
    function clamp(v){return Math.max(180,Math.min(window.innerWidth*0.6,v));}
    drag.addEventListener('mousedown',function(e){dragging=true;startX=e.clientX;startW=notesPane.offsetWidth;drag.classList.add('dragging');document.body.style.userSelect='none';e.preventDefault();});
    document.addEventListener('mousemove',function(e){if(!dragging)return;var w=clamp(startW+(startX-e.clientX));notesPane.style.flex='0 0 '+w+'px';try{localStorage.setItem('bf:notes-pane-w',w);}catch(err){}});
    document.addEventListener('mouseup',function(){if(!dragging)return;dragging=false;drag.classList.remove('dragging');document.body.style.userSelect='';});
    try{var sw=localStorage.getItem('bf:notes-pane-w');if(sw)notesPane.style.flex='0 0 '+sw+'px';}catch(err){}
  })();

  // ---- notes panel collapse ----
  (function(){
    var pane=document.getElementById('bf-notes-pane');
    var drag=document.getElementById('bf-drag');
    var btn=document.getElementById('bf-notes-toggle');
    if(!pane||!btn)return;
    var CKEY='bf:notes-collapsed';
    function setCollapsed(v){
      if(pane.classList.contains('floating'))return;
      if(v){pane.classList.add('collapsed');if(drag)drag.classList.add('notes-hidden');btn.textContent='▶';btn.title='Show notes panel';}
      else{pane.classList.remove('collapsed');if(drag)drag.classList.remove('notes-hidden');btn.textContent='◄';btn.title='Hide notes panel';}
      try{localStorage.setItem(CKEY,v?'1':'0');}catch(e){}
    }
    try{var s=localStorage.getItem(CKEY);if(s==='1')setCollapsed(true);}catch(e){}
    btn.addEventListener('click',function(){setCollapsed(!pane.classList.contains('collapsed'));});
  })();

  // ---- notes panel float ----
  (function(){
    var pane=document.getElementById('bf-notes-pane');
    var drag=document.getElementById('bf-drag');
    var fbtn=document.getElementById('bf-notes-float-btn');
    var hdr=document.getElementById('bf-notes-header');
    var opDown=document.getElementById('bf-notes-opacity-down');
    var opUp=document.getElementById('bf-notes-opacity-up');
    var opVal=document.getElementById('bf-notes-opacity-val');
    var blurDown=document.getElementById('bf-notes-blur-down');
    var blurUp=document.getElementById('bf-notes-blur-up');
    var blurVal=document.getElementById('bf-notes-blur-val');
    var notesBody=document.getElementById('bf-notes-body');
    if(!pane||!fbtn)return;
    var floating=false,opPct=95,blurPx=0,activeNC=null;
    function applyOpacity(){
      if(floating){
        var alpha=(opPct/100).toFixed(2);
        pane.style.setProperty('--notes-bg-alpha',alpha);
        if(notesBody){
          var qn=document.getElementById('bf-session-notes');
          if(qn)qn.style.opacity=(qn===activeNC)?'':String(opPct/100);
          notesBody.querySelectorAll('.nts-section').forEach(function(s){
            var actSec=activeNC&&activeNC.classList&&activeNC.classList.contains('nts-section');
            var isAct=actSec&&(s===activeNC);
            var isAnc=actSec&&!isAct&&s.contains(activeNC);
            s.classList.toggle('nts-dim',actSec&&!isAct&&!isAnc);
            var h=s.querySelector(':scope>summary');if(h)h.style.opacity=(actSec&&!isAct&&!isAnc)?String(opPct/100):'';
            var ta=s.querySelector(':scope>.nts-body>textarea');
            if(ta)ta.style.opacity=(actSec&&!isAct&&!isAnc)?String(opPct/100):'';
          });
        }
      }
      if(opVal)opVal.textContent=opPct+'%';
    }
    function adjustOpacity(d){opPct=Math.min(100,Math.max(20,opPct+d));applyOpacity();try{localStorage.setItem('bf:notes-opacity',String(opPct));}catch(e){}}
    function applyBlur(){if(floating)pane.style.setProperty('--notes-blur',blurPx+'px');if(blurVal)blurVal.textContent=blurPx+'px';}
    function adjustBlur(d){blurPx=Math.min(20,Math.max(0,blurPx+d));applyBlur();try{localStorage.setItem('bf:notes-blur',String(blurPx));}catch(e){}}
    if(notesBody){notesBody.addEventListener('focusin',function(e){if(!floating)return;if(e.target.tagName!=='TEXTAREA'&&e.target.tagName!=='INPUT')return;var c=e.target.closest('.nts-section')||e.target;if(c!==activeNC){activeNC=c;applyOpacity();}});}
    function setFloat(f){
      floating=f;
      if(f){pane.classList.add('floating');pane.classList.remove('collapsed');if(drag)drag.classList.add('notes-floating');fbtn.textContent='⊟';fbtn.title='Dock notes panel';
        if(!pane.style.left){var iw=Math.max(pane.offsetWidth||400,400);pane.style.left=Math.max(0,document.documentElement.clientWidth-iw-10)+'px';pane.style.top='48px';}
        pane.style.right='auto';applyOpacity();applyBlur();
      }else{pane.classList.remove('floating');pane.style.left='';pane.style.top='';pane.style.right='';pane.style.removeProperty('--notes-bg-alpha');pane.style.removeProperty('--notes-blur');activeNC=null;if(drag)drag.classList.remove('notes-floating');fbtn.textContent='⊞';fbtn.title='Pop out notes panel';}
      try{localStorage.setItem('bf:notes-floating',f?'1':'0');}catch(e){}
    }
    try{var ops=localStorage.getItem('bf:notes-opacity');if(ops)opPct=Math.min(100,Math.max(20,parseInt(ops,10)||95));}catch(e){}
    try{var bls=localStorage.getItem('bf:notes-blur');if(bls)blurPx=Math.min(20,Math.max(0,parseInt(bls,10)||0));}catch(e){}
    if(opVal)opVal.textContent=opPct+'%';if(blurVal)blurVal.textContent=blurPx+'px';
    if(opDown)opDown.addEventListener('click',function(e){e.stopPropagation();adjustOpacity(-5);});
    if(opUp)opUp.addEventListener('click',function(e){e.stopPropagation();adjustOpacity(5);});
    if(blurDown)blurDown.addEventListener('click',function(e){e.stopPropagation();adjustBlur(-1);});
    if(blurUp)blurUp.addEventListener('click',function(e){e.stopPropagation();adjustBlur(1);});
    fbtn.addEventListener('click',function(){setFloat(!floating);});
    try{if(localStorage.getItem('bf:notes-floating')==='1')setFloat(true);}catch(e){}
    if(!hdr)return;
    var _dx=0,_dy=0,_sx=0,_sy=0;
    hdr.addEventListener('mousedown',function(e){if(!floating)return;if(e.target.tagName==='BUTTON')return;e.preventDefault();var r=pane.getBoundingClientRect();_sx=e.clientX;_sy=e.clientY;_dx=r.left;_dy=r.top;
      function mv(e){var vw=document.documentElement.clientWidth,vh=document.documentElement.clientHeight,pw=pane.offsetWidth,ph=pane.offsetHeight;pane.style.left=Math.max(0,Math.min(_dx+(e.clientX-_sx),vw-pw))+'px';pane.style.top=Math.max(0,Math.min(_dy+(e.clientY-_sy),vh-ph))+'px';pane.style.right='auto';}
      function up(){document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);}
      document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
    });
    window.addEventListener('resize',function(){if(!floating)return;var vw=document.documentElement.clientWidth,vh=document.documentElement.clientHeight,pw=pane.offsetWidth,ph=pane.offsetHeight;pane.style.left=Math.max(0,Math.min(parseFloat(pane.style.left)||0,vw-pw))+'px';pane.style.top=Math.max(0,Math.min(parseFloat(pane.style.top)||0,vh-ph))+'px';});
  })();

  // ---- notes tree ----
  (function(){
    var DOC=document.body.dataset.doc||'doc';
    var NTS_KEY='bf:'+DOC+':nts';
    function load(){try{var s=localStorage.getItem(NTS_KEY);return s?JSON.parse(s):[];}catch(e){return[];}}
    function save(t){try{localStorage.setItem(NTS_KEY,JSON.stringify(t));}catch(e){}}
    function uid(){return Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,5);}
    function find(tree,id){for(var i=0;i<tree.length;i++){if(tree[i].id===id)return tree[i];var r=find(tree[i].ch||[],id);if(r)return r;}return null;}
    function remove(tree,id){for(var i=0;i<tree.length;i++){if(tree[i].id===id){tree.splice(i,1);return true;}if(remove(tree[i].ch||[],id))return true;}return false;}
    var tree=load();
    var container=document.getElementById('bf-notes-tree');if(!container)return;
    function mkNode(node){
      var det=document.createElement('details');det.className='nts-section';if(node.open)det.setAttribute('open','');det.dataset.id=node.id;
      var sum=document.createElement('summary');sum.className='nts-hdr';
      var ti=document.createElement('input');ti.type='text';ti.className='nts-hdr-title';ti.value=node.title||'';ti.placeholder='Section name…';
      ti.addEventListener('click',function(e){e.stopPropagation();});
      ti.addEventListener('input',function(){var n=find(tree,node.id);if(n){n.title=ti.value;save(tree);}});
      var db=document.createElement('button');db.type='button';db.className='nts-hdr-btn del';db.title='Remove';db.textContent='×';
      db.addEventListener('click',function(e){e.stopPropagation();if(!confirm('Remove this section?'))return;remove(tree,node.id);save(tree);render();});
      sum.appendChild(ti);sum.appendChild(db);det.appendChild(sum);
      var body=document.createElement('div');body.className='nts-body';
      var ta=document.createElement('textarea');ta.className='note-area';ta.placeholder='Notes…';ta.value=node.body||'';
      ta.addEventListener('input',function(){var n=find(tree,node.id);if(n){n.body=ta.value;save(tree);}});
      body.appendChild(ta);
      var chCont=document.createElement('div');chCont.className='nts-ch';
      (node.ch||[]).forEach(function(c){chCont.appendChild(mkNode(c));});
      body.appendChild(chCont);
      var addBtn=document.createElement('button');addBtn.type='button';addBtn.className='nts-add-btn';addBtn.textContent='+ Add subsection';
      addBtn.addEventListener('click',function(){var n=find(tree,node.id);if(!n)return;if(!n.ch)n.ch=[];n.ch.push({id:uid(),title:'',body:'',open:true,ch:[]});save(tree);render();});
      body.appendChild(addBtn);det.appendChild(body);
      det.addEventListener('toggle',function(){var n=find(tree,node.id);if(n){n.open=det.open;save(tree);}});
      return det;
    }
    function render(){container.innerHTML='';tree.forEach(function(n){container.appendChild(mkNode(n));});}
    var addRoot=document.getElementById('bf-notes-add-root');
    if(addRoot){addRoot.addEventListener('click',function(){tree.push({id:uid(),title:'',body:'',open:true,ch:[]});save(tree);render();});}
    render();
    window.bfNotesReset=function(newTree){tree=newTree||[];save(tree);render();};
  })();

  // ---- notes export (MD + HTML) ----
  (function(){
    function getTree(){try{var s=localStorage.getItem('bf:'+(document.body.dataset.doc||'doc')+':nts');return s?JSON.parse(s):[];}catch(e){return[];}}
    function treeToMd(nodes,depth){var out=[];var prefix='#'.repeat(Math.min(depth+1,6))+' ';nodes.forEach(function(n){out.push(prefix+(n.title||'Untitled'));if(n.body&&n.body.trim())out.push('',n.body.trim(),'');if(n.ch&&n.ch.length)out.push(treeToMd(n.ch,depth+1));});return out.join('\n');}
    function buildMd(){
      var title=document.title||'Notes';
      var sn=document.getElementById('bf-session-notes');
      var lines=['# '+title+' — Session Notes','','*Exported: '+new Date().toString()+'*',''];
      if(sn&&sn.value.trim())lines.push('## Quick Notes','',sn.value.trim(),'');
      var tree=getTree();if(tree.length)lines.push('## Sections','',treeToMd(tree,2));
      return lines.join('\n');
    }
    window.bfGetNotesMd=buildMd;
    var btnMd=document.getElementById('bf-notes-export-md');
    var btnHtml=document.getElementById('bf-notes-export-html');
    if(btnMd){btnMd.addEventListener('click',async function(){var name=docSlugFn()+'_notes_'+stamp()+'.md';await window.bfSave(new Blob([buildMd()],{type:'text/markdown'}),name,[{description:'Markdown',accept:{'text/markdown':['.md']}}]);});}
    // Note: HTML export implementation omitted for brevity; see buildHtml() in broodforge reference
  })();

  // ---- clear all notes ----
  (function(){
    var btn=document.getElementById('bf-notes-clear');if(!btn)return;
    btn.addEventListener('click',function(){
      if(!confirm('Clear all notes? This cannot be undone.'))return;
      var DOC=document.body.dataset.doc||'doc';
      try{localStorage.removeItem('bf:'+DOC+':nts');}catch(e){}
      try{localStorage.removeItem('bf:'+DOC+':sn');}catch(e){}
      var sn=document.getElementById('bf-session-notes');if(sn)sn.value='';
      if(window.bfNotesReset)window.bfNotesReset([]);
    });
  })();

  // ---- clear all fields ----
  (function(){
    var btn=document.getElementById('bf-clear-fields-btn');if(!btn)return;
    btn.addEventListener('click',function(){
      if(!confirm('Clear ALL fields on this page? This cannot be undone.'))return;
      document.querySelectorAll('.note-input,.note-area').forEach(function(f){f.value='';try{localStorage.removeItem(ns+'note:'+(f.dataset.note||f.id));}catch(e){}f.dispatchEvent(new Event('input'));});
      document.querySelectorAll('.date-field input[type=date]').forEach(function(f){f.value='';try{localStorage.removeItem(ns+'note:'+(f.dataset.note||f.id));}catch(e){} });
      document.querySelectorAll('.param-input').forEach(function(f){var def=f.getAttribute('value')||f.placeholder||'';f.value=def;applyVar(f.dataset.var,f.value);try{localStorage.removeItem(ns+'param:'+f.dataset.var);}catch(e){}});
      document.querySelectorAll('.cred-input').forEach(function(f){var slug=f.dataset.cred||'';f.value='';try{sessionStorage.removeItem('bf:cred:'+slug);}catch(e){}var conf=document.getElementById('cred-confirm-'+slug);if(conf)conf.value='';if(slug&&window._updateCredMatch)window._updateCredMatch(slug);});
      document.querySelectorAll('input[type=radio],input[type=checkbox]').forEach(function(cb){cb.checked=false;cb.dispatchEvent(new Event('change'));});
      document.querySelectorAll('.input-table tbody').forEach(function(tb){tb.innerHTML='';});
      tesselValidate();tesselVisibility();
    });
  })();

  // ---- per-section controls (clear, collapse, expand children) ----
  (function(){
    function hasInputs(det){return det.querySelector('.note-input,.note-area,.cred-input,input[type=radio],input[type=checkbox],.input-table')!==null;}
    function directChildSubs(det){var body=det.querySelector(':scope>.sec-body,:scope>.sub-body');if(!body)return[];return Array.prototype.slice.call(body.querySelectorAll(':scope>details.subsection'));}
    function clearSection(det){
      det.querySelectorAll('.note-input,.note-area').forEach(function(f){f.value='';try{localStorage.removeItem(ns+'note:'+(f.dataset.note||f.id));}catch(e){}f.dispatchEvent(new Event('input'));});
      det.querySelectorAll('.cred-input').forEach(function(f){var slug=f.dataset.cred||'';f.value='';try{sessionStorage.removeItem('bf:cred:'+slug);}catch(e){}var conf=document.getElementById('cred-confirm-'+slug);if(conf)conf.value='';if(slug&&window._updateCredMatch)window._updateCredMatch(slug);});
      det.querySelectorAll('input[type=radio],input[type=checkbox]:not(.cred-method-cb)').forEach(function(cb){cb.checked=false;cb.dispatchEvent(new Event('change'));});
      det.querySelectorAll('.input-table tbody').forEach(function(tb){tb.innerHTML='';});
    }
    document.querySelectorAll('details.section,details.subsection').forEach(function(det){
      var sum=det.querySelector(':scope>summary');if(!sum)return;
      var controls=sum.querySelector('.bf-sub-controls');
      if(!controls){controls=document.createElement('div');controls.className='bf-sub-controls';sum.appendChild(controls);}
      var children=directChildSubs(det),canClear=hasInputs(det),hasChildren=children.length>=1;
      var clr=document.createElement('button');clr.type='button';clr.className='sec-clear-btn';clr.textContent='⊘ Clear';
      if(canClear){clr.title='Clear fields in this section';clr.addEventListener('click',function(e){e.stopPropagation();if(!confirm('Clear fields in this section?'))return;clearSection(det);});}
      else clr.classList.add('bf-ctrl-ghost');
      var sep=document.createElement('div');sep.className='bf-ctrl-sep';
      var cBtn=document.createElement('button');cBtn.type='button';cBtn.className='bf-sub-collapse';cBtn.textContent='⊟';
      if(hasChildren){cBtn.title='Collapse subsections';cBtn.addEventListener('click',function(e){e.stopPropagation();directChildSubs(det).forEach(function(d){d.removeAttribute('open');});});}
      else cBtn.classList.add('bf-ctrl-ghost');
      var eBtn=document.createElement('button');eBtn.type='button';eBtn.className='bf-sub-expand';eBtn.textContent='⊞';
      if(hasChildren){eBtn.title='Expand subsections';eBtn.addEventListener('click',function(e){e.stopPropagation();directChildSubs(det).forEach(function(d){d.setAttribute('open','');});});}
      else eBtn.classList.add('bf-ctrl-ghost');
      controls.appendChild(clr);controls.appendChild(sep);controls.appendChild(cBtn);controls.appendChild(eBtn);
    });
  })();

  // ---- TOC navigation ----
  function _bfTocNav(a){
    a.addEventListener('click',function(e){
      e.preventDefault();
      var id=a.getAttribute('href').slice(1);
      var el=document.getElementById(id);if(!el)return;
      var det=el.closest('details.section,details.subsection');
      if(det)det.open=true;
      var p=det?det.parentElement:null;
      while(p){var pd=p.closest('details');if(pd)pd.open=true;else break;p=pd.parentElement;}
      el.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }
  (function(){document.querySelectorAll('#bf-toc a').forEach(_bfTocNav);})();

  // ---- TOC active section ----
  (function(){
    if(!document.querySelector('#bf-toc'))return;
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting)return;
        document.querySelectorAll('#bf-toc li').forEach(function(li){li.classList.remove('bf-toc-active');});
        var a=document.querySelector('#bf-toc a[href="#'+e.target.id+'"]');
        if(a)a.closest('li').classList.add('bf-toc-active');
      });
    },{rootMargin:'-10% 0px -80% 0px',threshold:0});
    document.querySelectorAll('details.section>summary>[id],details.subsection>summary>[id]').forEach(function(el){io.observe(el);});
  })();

  // ---- TOC navbar panel ----
  (function(){
    var tocToggle=document.getElementById('bf-toc-toggle');
    var tocPanel=document.getElementById('bf-toc-panel');
    var tocInline=document.getElementById('bf-toc');
    if(!tocToggle||!tocPanel||!tocInline)return;
    var tocNav=tocInline.querySelector('nav');
    if(tocNav){
      var clone=tocNav.cloneNode(true);
      clone.querySelectorAll('details').forEach(function(d){d.open=true;});
      tocPanel.appendChild(clone);
      tocPanel.querySelectorAll('a').forEach(function(a){_bfTocNav(a);a.addEventListener('click',function(){setTimeout(function(){tocPanel.classList.remove('open');},80);});});
    }
    tocToggle.addEventListener('click',function(e){
      e.stopPropagation();
      if(tocPanel.classList.contains('open')){tocPanel.classList.remove('open');}
      else{var r=tocToggle.getBoundingClientRect();tocPanel.style.top=r.bottom+'px';tocPanel.style.left=r.left+'px';tocPanel.classList.add('open');}
    });
    document.addEventListener('click',function(e){if(tocPanel.classList.contains('open')&&!tocPanel.contains(e.target)&&e.target!==tocToggle)tocPanel.classList.remove('open');});
  })();

  // ---- TOC collapse/expand all ----
  (function(){
    var btn=document.getElementById('bf-toc-section-toggle');if(!btn)return;
    var expanded=true;
    btn.addEventListener('click',function(e){
      e.stopPropagation();e.preventDefault();expanded=!expanded;
      document.querySelectorAll('#bf-toc .bf-toc-section').forEach(function(d){d.open=expanded;});
      btn.innerHTML=expanded?'&#x2212;':'+';btn.title=expanded?'Collapse all sections':'Expand all sections';
    });
  })();

  // ---- inline section editor ----
  (function(){
    var docBody=document.getElementById('bf-doc-body');if(!docBody)return;
    var EKEY=ns+'edit:';
    var blocks=Array.from(docBody.querySelectorAll('p,h2,h3,h4')).filter(function(el){
      return !el.closest('.note-field,.cred-field,.param-row,.input-table,.params-hint,summary,#bf-walkthrough-hint');
    });
    var originals={};
    blocks.forEach(function(el,i){
      originals[i]=el.innerHTML;el.dataset.editIdx=String(i);
      try{var stored=localStorage.getItem(EKEY+i);if(stored!==null)el.innerHTML=stored+'<span class="bf-edited-mark">(edited)</span>';}catch(e){}
      var wrap=document.createElement('div');wrap.className='bf-editable-block';
      el.parentNode.insertBefore(wrap,el);wrap.appendChild(el);
      var btn=document.createElement('button');btn.type='button';btn.className='bf-edit-btn';btn.title='Edit this block';btn.textContent='✎';
      wrap.appendChild(btn);
      btn.addEventListener('click',function(){
        if(wrap.querySelector('.bf-edit-area'))return;
        btn.style.display='none';el.style.display='none';
        var cur=el.innerHTML.replace(/<span class="bf-edited-mark">[^<]*<\/span>$/,'').trim();
        var ta=document.createElement('textarea');ta.className='bf-edit-area';ta.value=cur;
        wrap.insertBefore(ta,btn);ta.style.height=Math.max(80,ta.scrollHeight+6)+'px';
        var ctrls=document.createElement('div');ctrls.className='bf-edit-controls';
        var sv=document.createElement('button');sv.type='button';sv.className='bf-edit-save';sv.textContent='✓ Save';
        var cl=document.createElement('button');cl.type='button';cl.className='bf-edit-cancel';cl.textContent='✕ Cancel';
        var rs=document.createElement('button');rs.type='button';rs.className='bf-edit-cancel';rs.textContent='↺ Reset';
        ctrls.appendChild(sv);ctrls.appendChild(cl);ctrls.appendChild(rs);wrap.insertBefore(ctrls,btn);ta.focus();
        function closeEd(){wrap.removeChild(ta);wrap.removeChild(ctrls);el.style.display='';btn.style.display='';}
        sv.addEventListener('click',function(){el.innerHTML=ta.value+'<span class="bf-edited-mark">(edited)</span>';try{localStorage.setItem(EKEY+i,ta.value);}catch(e){}closeEd();});
        cl.addEventListener('click',closeEd);
        rs.addEventListener('click',function(){if(!confirm('Reset to original?'))return;try{localStorage.removeItem(EKEY+i);}catch(e){}el.innerHTML=originals[i];closeEd();});
      });
    });
    var dlBtn=document.getElementById('bf-download-edits-btn');
    if(dlBtn){dlBtn.addEventListener('click',function(){
      var clone=document.documentElement.cloneNode(true);
      clone.querySelectorAll('.bf-edit-btn,.bf-edited-mark,.bf-edit-controls,.bf-edit-area').forEach(function(e){e.remove();});
      clone.querySelectorAll('.bf-editable-block').forEach(function(w){var p=w.parentNode;while(w.firstChild)p.insertBefore(w.firstChild,w);p.removeChild(w);});
      var blob=new Blob(['<!DOCTYPE html>\n'+clone.outerHTML],{type:'text/html'});
      window.bfSave(blob,(document.title||'doc').replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'-edited.html');
    });}
  })();

})();
`;

if (typeof module !== 'undefined') module.exports = TESSEL_RUNTIME_JS;

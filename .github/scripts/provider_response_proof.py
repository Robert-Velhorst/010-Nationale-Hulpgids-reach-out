"""Hosted-only normal compiler, real owned HTTP and complete source proof."""
import datetime,hashlib,json,os,pathlib,subprocess,sys
assert os.environ.get('GITHUB_ACTIONS')=='true' and os.environ.get('RUNNER_ENVIRONMENT')=='github-hosted'
assert os.environ.get('GITHUB_REPOSITORY')=='Robert-Velhorst/010-Nationale-Hulpgids-reach-out'
root=pathlib.Path(__file__).resolve().parents[2];out=root/'PROVIDER_RESPONSE_EVIDENCE';out.mkdir(exist_ok=True)
def git(*args):return subprocess.check_output(['git','-C',str(root),*args])
def snapshot():
    rows={}
    for r in git('ls-tree','-rz','HEAD').split(b'\0'):
        if not r:continue
        h,n=r.split(b'\t');mode,kind,blob=h.decode().split();assert kind=='blob';p=root/os.fsdecode(n);b=os.readlink(p).encode() if mode=='120000' else p.read_bytes();assert hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==blob;rows[os.fsdecode(n)]={'blob':blob,'sha256':hashlib.sha256(b).hexdigest()}
    return rows
before=snapshot();(out/'source-before.json').write_text(json.dumps(before,indent=2))
assert subprocess.check_output(['node','--version']).decode().strip()=='v26.12.1'
record={'captured_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'head':git('rev-parse','HEAD').decode().strip(),'tree':git('rev-parse','HEAD^{tree}').decode().strip(),'node':'v26.12.1','steps':[],'original_cases_helpers_assertions_selectors_timeouts_commands_changed':False,'full_vendor_SDK_native_application_database_provider_or_live_deployment_acceptance':False}
def run(name,argv,cwd=root):
    with (out/(name+'.log')).open('wb') as stream:r=subprocess.run(argv,cwd=cwd,stdout=stream,stderr=subprocess.STDOUT,timeout=180)
    record['steps'].append({'name':name,'argv':list(map(str,argv)),'returncode':r.returncode,'log':name+'.log','sha256':hashlib.sha256((out/(name+'.log')).read_bytes()).hexdigest()});return r.returncode
try:
    compiler=root/'PROVIDER_RESPONSE_TOOLS/node_modules/.bin/esbuild'
    originals=out/'original';originals.mkdir(exist_ok=True)
    for name in ['map.ts','llm.ts','env.ts']:(originals/name).write_bytes(git('show','bb3c9351ec63d0f7002d731ad9b30a30bd984f0a:server/_core/'+name))
    for label,source in [('original',originals),('patched',root/'server/_core')]:
        for adapter,name in [('map','map.ts'),('llm','llm.ts')]:
            assert run(label+'-'+adapter+'-build',[str(compiler),str(source/name),'--bundle','--platform=node','--format=cjs','--outfile='+str(out/(label+'-'+adapter+'.cjs'))])==0
        code=run(label+'-cases',['node',str(root/'.github/qualification/provider-response-cases.cjs'),label]);actual=json.loads((out/(label+'-cases.log')).read_bytes());record[label]=actual
        assert actual['cases']==24 and actual['skipped']==0
        if label=='original':assert code!=0 and actual['failed']==16 and actual['passed']==8
        else:assert code==0 and actual['failed']==0 and actual['passed']==24
    assert run('compiler-actual-graph',['npm','ls','--all','--json'],cwd=root/'PROVIDER_RESPONSE_TOOLS')==0
    assert run('compiler-audit',['npm','audit','--json'],cwd=root/'PROVIDER_RESPONSE_TOOLS')==0
    record['component_acceptance']=True
finally:
    after=snapshot();(out/'source-after.json').write_text(json.dumps(after,indent=2));record['all_tracked_source_unchanged']=before==after;(out/'receipt.json').write_text(json.dumps(record,indent=2));assert before==after

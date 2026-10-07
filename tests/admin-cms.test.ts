import {test} from 'node:test'
import assert from 'node:assert/strict'
import {blocksToText,textToBlocks,cmsPayload,isCmsKind} from '../lib/admin/cms'
test('rich content round-trips through the editor text form',()=>{const blocks=[{type:'heading' as const,text:'Title'},{type:'paragraph' as const,text:'Body text'},{type:'list' as const,items:['a','b']},{type:'quote' as const,text:'Quote'}];assert.deepEqual(textToBlocks(blocksToText(blocks)),blocks)})
test('empty text yields no blocks and long content is capped',()=>{assert.deepEqual(textToBlocks('  \n\n '),[]);assert.equal(textToBlocks(Array.from({length:300},(_,i)=>'p'+i).join('\n\n')).length,200)})
test('payload never contains identity or audit fields and nulls blanks',()=>{const p=cmsPayload('news',{slug:'a',title:'T',status:'draft',content:'x',excerpt:'',authorId:'evil',role:'admin'},false);assert.equal('authorId' in p,false);assert.equal('role' in p,false);assert.equal(p.excerpt,null);assert.equal(p.publishedAt,null)})
test('publishing without a date stamps one so the strict schema accepts it',()=>{assert.ok(typeof cmsPayload('announcements',{slug:'a',title:'T',status:'published'},false).publishedAt==='string')})
test('scholarship payload converts line lists',()=>{const p=cmsPayload('scholarships',{slug:'s',title:'S',status:'draft',eligibility:'a\n\n b ',requiredDocuments:''},false);assert.deepEqual(p.eligibility,['a','b']);assert.deepEqual(p.requiredDocuments,[])})
test('kind guard',()=>{assert.ok(isCmsKind('events'));assert.equal(isCmsKind('users'),false)})

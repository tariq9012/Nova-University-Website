'use client'
import Image from 'next/image'
import {useState} from 'react'
export function CmsImage({src,alt}:{src:string;alt:string}){const [failed,setFailed]=useState(false);return failed?<div className="cms-image-fallback" role="img" aria-label={alt||'Article image unavailable'}><span>Image unavailable</span></div>:<Image className="cms-image" src={src} alt={alt} width={1200} height={675} unoptimized onError={()=>setFailed(true)}/>}

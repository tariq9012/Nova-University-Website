'use client'
import {useState} from 'react'
export function ShareControls(){const [message,setMessage]=useState('');return <div className="cms-share"><button className="button dark" type="button" onClick={async()=>{try{await navigator.clipboard.writeText(window.location.href);setMessage('Link copied.')}catch{setMessage('Copy the address from your browser to share this page.')}}}>Copy page link</button><span role="status">{message}</span></div>}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const Globe = dynamic(() => import('@/components/Globe'), { ssr: false });

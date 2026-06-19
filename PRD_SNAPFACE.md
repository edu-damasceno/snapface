# PRD: SnapFace — Auto-Capture Selfie PWA

## 1. Visão do Produto

**SnapFace** é um Progressive Web App (PWA) de selfie que usa inteligência artificial para capturar fotos automaticamente quando detecta que o rosto está bem posicionado, iluminado e estável — sem precisar apertar nenhum botão.

**Posicionamento:** Para pessoas que querem tirar selfies consistentemente boas sem a complicação de segurar o celular, enquadrar e apertar o botão ao mesmo tempo. Diferente de câmeras nativas (que exigem botão ou timer) e de apps como Snapchat/Instagram (que focam em filtros e social), o SnapFace foca em uma coisa: **capturar a melhor selfie possível automaticamente**.

**Origem:** A tecnologia é extraída do sistema de captura facial do OneDocs, testado em produção com milhares de dispositivos reais, incluindo edge cases (bugs de GPU no Samsung S25, problemas de memória no Zenfone 8, dispositivos low-end).

---

## 2. Público-Alvo

| Segmento | Perfil | Motivação |
|---|---|---|
| **Primário** | Jovens 18-35, tiradores frequentes de selfie | Conveniência e qualidade sem complexidade |
| **Secundário** | Criadores de conteúdo | Selfies hands-free em lote para redes sociais, perfis de dating, headshots profissionais |
| **Terciário** | Usuários com necessidades de acessibilidade | Auto-captura remove a necessidade de coordenação motora para apertar botão |
| **Nicho documento** | Pessoas que precisam de foto 3x4 | Evitar pagar R$15-30 em estúdio/cabine para foto de documento |

**Anti-persona:** Fotógrafos profissionais, heavy users de Snapchat/TikTok que querem filtros AR como feature principal.

---

## 3. Problema

1. **O fumble do botão:** Tirar selfie exige segurar o celular + enquadrar o rosto + apertar o botão — o que frequentemente mexe o enquadramento, causa blur ou pega uma expressão estranha.
2. **Tirar várias é tedioso:** Conseguir "a foto certa" significa apertar o botão repetidamente. Cada toque interrompe o fluxo.
3. **Foto 3x4 é cara e inconveniente:** Uma foto de documento simples custa R$15-30 em estúdio ou cabine, e exige deslocamento.
4. **Instalar mais um app é atrito:** Ninguém quer baixar outro app da store. PWA resolve isso — abre no navegador e funciona.

---

## 4. Diferencial Competitivo

| Feature | SnapFace (MVP) | Câmera Nativa | Snapchat | Instagram |
|---|---|---|---|---|
| Auto-captura por IA | **Core feature** | Não (só timer) | Não | Não |
| Sem instalação | **Sim (PWA)** | Pré-instalado | App store | App store |
| Modo contínuo | **Sim** | Burst (segura botão) | Não | Não |
| Validação de qualidade do rosto | **Sim** (tamanho, posição, orientação) | Não | Não | Não |
| Modelos de formato (3x4, 1:1, etc.) | **Sim** | Não | Não | Não |
| Cross-platform | **Todos os browsers** | Locked por plataforma | iOS/Android | iOS/Android |
| Custo | **Grátis** | Grátis | Grátis + IAP | Grátis + IAP |

**Nenhum concorrente oferece auto-captura por IA para selfies.** Esse é o diferencial central.

---

## 5. Features do MVP

### 5.1 Auto-Captura por IA (Core)

Motor de captura baseado no MediaPipe FaceLandmarker com 468 landmarks faciais.

**Como funciona:**
1. Câmera frontal ativa → detecção contínua a ~20 FPS
2. Valida em tempo real: tamanho do rosto, posição (centralizado), orientação (olhando pra frente), rosto completo no frame
3. Feedback visual imediato: borda colorida no guia (sem rosto → nada, detectado mas mal posicionado → amarelo, válido → verde, estabilizando → verde pulsante)
4. Quando todas as validações passam por ~1 segundo (estabilidade), countdown visual (3-2-1) e captura automática
5. Flash branco (100ms) sinaliza a captura
6. Câmera volta imediatamente para o modo de detecção → próxima foto

**Dois níveis de validação:**
- `isVisuallyValid`: Feedback visual responsivo (borda verde/amarela) — mais permissivo
- `isCaptureValid`: Trigger de captura — mais estável, requer consistência por ~1s

**Parâmetros técnicos (modo livre/social):**
- Face width target: 250px, desvio tolerado: 120px
- Distância: too_far < 200px, too_close > 320px (com histerese de 10px)
- Ângulo: 40° para ativar lado, 30° para retornar ao centro
- Estabilidade: 25px max movimento, 15px max mudança de largura, 1000ms duração
- Confiança de detecção: 0.3 (otimizado para CPU delegate — compatibilidade universal)

#### 5.1.1 Captura ao sorriso (implementado)

Toggle opcional na tela da câmera (`Captura ao sorrir`). Quando ativo:

1. MediaPipe blendshapes (`mouthSmileLeft` + `mouthSmileRight`) calculam `smileIntensity`
2. Após posicionamento válido, guidance exibe **"Sorria!"**
3. Sorriso detectado (intensidade > 0.4) → captura **instantânea** (sem countdown)
4. Após retake, exige novo sorriso (não dispara em loop se o usuário continuar sorrindo)
5. Preferência persistida em cookie (`snapface-smile-mode`, 1 ano)

Modo padrão (toggle off) permanece inalterado: estabilidade + countdown 3s.

**Melhorias de UX relacionadas (implementadas):**
- Seletor de cor ambiente (14 swatches) com contraste adaptativo de textos
- Layout flex centralizado na captura e na tela de confirmação
- Roda de cores com scroll horizontal completo no mobile

### 5.2 Modelos de Captura (Formatos)

Seletor de formato acessível na tela da câmera (ícone ou drawer inferior):

| Modelo | Aspect Ratio | Resolução Output | Validação | Uso |
|---|---|---|---|---|
| **Livre** (padrão) | Full frame | Resolução nativa | Relaxada | Selfie casual |
| **1:1 Quadrado** | 1:1 | 1080x1080 | Relaxada | Perfil, redes sociais |
| **3x4 Documento** | 3:4 | 1440x1920 | **Rígida** (mesma do OneDocs) | RG, CNH, passaporte |
| **4:5 Retrato** | 4:5 | 1080x1350 | Relaxada | Instagram retrato |
| **5:7 Clássico** | 5:7 | 1080x1512 | Relaxada | Retrato clássico |
| **9:16 Stories** | 9:16 | 1080x1920 | Relaxada | Stories, Reels, TikTok |

**Comportamento por modelo:**
- **Guia visual:** Overlay na câmera mostrando o formato selecionado (retângulo/quadrado com cantos arredondados)
- **Modo documento (3x4):** Guias de posicionamento mais rígidos, thresholds iguais ao OneDocs (FACE_DEVIATION: 85px, histerese 35°/25°), zoom adaptativo baseado no tamanho do rosto
- **Modos sociais:** Thresholds relaxados, mais tolerante com posição e ângulo
- **Crop automático:** A foto é recortada no formato selecionado após captura, usando a posição do rosto como âncora

**Implementação:** Cada modelo é definido por um objeto de configuração:
```typescript
interface CaptureFormat {
  id: string;
  label: string;
  aspectRatio: [number, number]; // [width, height]
  outputResolution: [number, number];
  validationStrictness: 'relaxed' | 'strict';
  faceDeviation: number; // px tolerance
  guideShape: 'circle' | 'rectangle' | 'oval';
}
```

### 5.3 Modo Contínuo

Após cada auto-captura, a câmera volta automaticamente para o modo de detecção. O usuário muda de pose → nova captura automática → repete.

- **Cooldown:** 1.5s entre capturas para evitar spam e dar tempo de mudar de pose
- **Pause/Resume:** Botão toggle para pausar a auto-captura (câmera continua live, detecção para)
- **Contador:** Badge no canto mostrando quantas fotos foram tiradas na sessão

### 5.4 Galeria da Sessão

- **Thumbnail strip:** Faixa horizontal scrollável no rodapé da tela da câmera
- **Última foto à esquerda**, scroll horizontal para ver anteriores
- **Tap no thumbnail:** Abre preview em tela cheia com swipe para navegar
- **Máximo 50 fotos** por sessão (gestão de memória)
- **Armazenamento:** Blob URLs em React state — apenas durante a sessão do browser
- **Aviso ao sair:** `beforeunload` event pergunta se quer baixar antes de fechar

### 5.5 Ações de Foto

**Individual (no preview em tela cheia):**
- **Download:** Baixa JPEG com nome descritivo (`snapface_2026-06-12_14-30-25.jpg`)
- **Compartilhar:** Web Share API (se disponível) para compartilhar direto
- **Excluir:** Remove da galeria com confirmação

**Em lote:**
- **Download All:** Gera ZIP client-side (via JSZip) com todas as fotos e dispara download
- **Limpar tudo:** Remove todas as fotos com confirmação

### 5.6 PWA

- `manifest.json` com nome, ícones, tema, `display: standalone`
- Service worker (via vite-plugin-pwa) para cache do app shell
- Prompt "Adicionar à tela inicial" 
- Funciona em Chrome (Android/Desktop), Safari (iOS), Firefox, Edge

### 5.7 Configurações

Drawer de configurações acessível via ícone de engrenagem:

- **Delay da captura:** 1s / 2s / 3s (countdown antes da foto)
- **Qualidade da foto:** Padrão (0.85 JPEG) / Alta (0.95 JPEG) / Máxima (1.0 JPEG)
- **Espelhar foto salva:** Toggle (preview da câmera é sempre espelhado, mas a foto salva pode ser espelhada ou não)
- Armazenado em `localStorage`

---

## 6. Fluxos de Usuário

### 6.1 Primeiro Acesso

```
1. Abre URL (link compartilhado ou direto)
2. Landing page: hero com tagline + CTA "Começar a Capturar"
3. Browser pede permissão de câmera
4. Se concedida: MediaPipe WASM carrega (~11.4MB), câmera inicia, detecção começa
5. Tela da câmera com guia do formato selecionado (padrão: Livre)
6. Texto de guidance: "Posicione seu rosto no centro"
7. Rosto detectado e válido → borda verde → estabilidade → countdown → flash → foto!
8. Foto aparece no thumbnail strip
9. Câmera volta ao modo de detecção automaticamente
```

### 6.2 Usuário Retornando (PWA Instalada)

```
1. Abre app da home screen (modo standalone)
2. Permissão de câmera já concedida
3. Direto para tela da câmera (pula landing page)
4. Fotos da sessão anterior não persistem (session-only no MVP)
```

### 6.3 Troca de Formato

```
1. Na tela da câmera, toca no ícone de formato (canto inferior)
2. Drawer abre com os 6 formatos disponíveis
3. Seleciona "3x4 Documento"
4. Guia visual muda para retângulo 3:4 com guidelines mais rígidas
5. Validação fica mais exigente (rosto precisa estar mais centralizado)
6. Auto-captura funciona normalmente dentro do novo formato
```

### 6.4 Galeria e Download

```
1. Toca em thumbnail no strip
2. Preview em tela cheia abre (swipeable)
3. Botões: Download, Compartilhar, Excluir
4. "Download All" na view de galeria cria ZIP
5. Botão voltar retorna para câmera
```

### 6.5 Erros

- **Permissão de câmera negada:** Modal com instruções para habilitar nas configurações do browser
- **MediaPipe falha ao carregar:** Fallback para botão manual de captura (sem auto-captura)
- **Dispositivo com pouca memória:** Degradação graceful via resolução adaptativa
- **iOS Safari quirks:** Tratamento específico para WebRTC no Safari

---

## 7. Arquitetura Técnica

### 7.1 Stack

| Tecnologia | Função |
|---|---|
| React 18 + TypeScript | Framework UI |
| Vite 7 | Build tool |
| Tailwind CSS 4 | Estilização |
| @mediapipe/tasks-vision | Face detection (FaceLandmarker, 468 landmarks) |
| vite-plugin-pwa | PWA (manifest, service worker) |
| JSZip | Download em lote (ZIP client-side) |
| Plausible/Umami | Analytics privacy-first (opcional) |

### 7.2 Módulos Reutilizados do OneDocs

| Módulo | Arquivo Fonte | O que faz | Adaptação |
|---|---|---|---|
| `MediaPipeFaceDetection` | `src/lib/MediaPipeFaceDetection.ts` | Wrapper do MediaPipe com 468 landmarks, histerese, detecção de direção | Remover `import.meta.env.BASE_URL`, tornar path WASM configurável |
| `ReactMediaPipe` | `src/lib/ReactMediaPipe.tsx` | Componente React que integra câmera + loop de detecção | Remover: useWakeLock, trackClarityEvent, logger. Manter: init câmera, video setup, detection loop, captureImage() |
| `FaceDetectionContext` | `src/contexts/FaceDetectionContext.tsx` | Estado centralizado de face detection | Remover: newRelicLogger, startPerformanceTimer. Manter: gerenciamento de estado, detecção de direção com histerese |
| `CapturePreview` | `src/components/CapturePreview.tsx` | Validação de distância/posição com dual validation | Remover: validação específica de documento. Adaptar thresholds por formato |
| `canvasOptimization` | `src/utils/canvasOptimization.ts` | Patch global para `willReadFrequently: true` | Usar como está |
| `useAutoCapture` | `src/hooks/useAutoCapture.ts` | Hook de auto-captura com estabilidade e countdown | Ajustar configs default para selfie |
| `useWakeLock` | `src/hooks/useWakeLock.ts` | Mantém tela ligada | Usar como está |
| `useDebounce` | `src/hooks/useDebounce.ts` | Debounce genérico | Usar como está |
| `processImageTo3x4HighRes()` | `src/components/SelfieBlurDetection.tsx:391-546` | Captura high-res com crop 3:4 e zoom adaptativo | Extrair e generalizar para múltiplos formatos |

### 7.3 Módulos Novos

| Módulo | Função |
|---|---|
| `src/pages/LandingPage.tsx` | Hero + CTA para primeiro acesso |
| `src/pages/CameraPage.tsx` | Tela principal com câmera, auto-captura, overlays, thumbnail strip |
| `src/pages/GalleryPage.tsx` | Review de fotos em tela cheia com swipe |
| `src/components/FaceGuide.tsx` | Overlay simplificado com borda de status colorida |
| `src/components/FormatGuide.tsx` | Overlay do formato selecionado (3x4, 1:1, etc.) |
| `src/components/FormatSelector.tsx` | Drawer/modal de seleção de formato |
| `src/components/ThumbnailStrip.tsx` | Faixa horizontal de thumbnails |
| `src/components/PhotoPreview.tsx` | Preview em tela cheia com ações |
| `src/components/CaptureFlash.tsx` | Animação de flash branco na captura |
| `src/components/SettingsPanel.tsx` | Drawer de configurações |
| `src/contexts/GalleryContext.tsx` | Estado da galeria da sessão |
| `src/hooks/useSessionGallery.ts` | Gerencia array de fotos, blob URLs, limite de memória |
| `src/hooks/usePhotoDownload.ts` | Download individual e em lote (ZIP) |
| `src/hooks/useSettings.ts` | Settings via localStorage |
| `src/hooks/useCaptureFormat.ts` | Gerencia formato selecionado e configurações por formato |
| `src/utils/formatProcessor.ts` | Lógica de crop por formato (generalização do processImageTo3x4HighRes) |
| `src/types/CaptureFormat.ts` | Tipos e constantes dos formatos |

### 7.4 Estrutura do Projeto

```
snapface/
  public/
    wasm/mediapipe/              # WASM files (postinstall)
    manifest.json
    icons/                       # PWA icons
  src/
    lib/
      MediaPipeFaceDetection.ts  # Do OneDocs (limpo)
      ReactMediaPipe.tsx         # Do OneDocs (simplificado)
    contexts/
      FaceDetectionContext.tsx    # Do OneDocs (simplificado)
      GalleryContext.tsx          # Novo
    hooks/
      useAutoCapture.ts          # Do OneDocs
      useWakeLock.ts             # Do OneDocs
      useDebounce.ts             # Do OneDocs
      useSessionGallery.ts       # Novo
      usePhotoDownload.ts        # Novo
      useSettings.ts             # Novo
      useCaptureFormat.ts        # Novo
    components/
      FaceGuide.tsx              # Novo (simplificação do CapturePreview)
      FormatGuide.tsx            # Novo
      FormatSelector.tsx         # Novo
      ThumbnailStrip.tsx         # Novo
      PhotoPreview.tsx           # Novo
      CaptureFlash.tsx           # Novo
      SettingsPanel.tsx          # Novo
    pages/
      LandingPage.tsx            # Novo
      CameraPage.tsx             # Novo
      GalleryPage.tsx            # Novo
    utils/
      canvasOptimization.ts      # Do OneDocs
      formatProcessor.ts         # Novo (generalização do processImageTo3x4HighRes)
      constants.ts               # Adaptado do OneDocs
    types/
      CaptureFormat.ts           # Novo
    App.tsx
    main.tsx
    index.css
```

### 7.5 Performance Budget

| Recurso | Target |
|---|---|
| Bundle JS inicial | < 200KB gzipped |
| MediaPipe WASM | ~11.4MB (on-demand, cached pelo SW) |
| MediaPipe model | ~4MB (CDN Google, cache do browser) |
| Tempo até primeira captura | < 5s após permissão (mid-range device) |
| FPS de detecção | ~20 FPS (CPU delegate, 50ms intervalo) |
| Memória ativa | < 150MB (imagens como blobs comprimidos, max 50/sessão) |

---

## 8. Monetização

### Fase 1 — Grátis (Lançamento)
Todas as features do MVP grátis. Objetivo: aquisição e retenção de usuários.

### Fase 2 — Freemium

| | Free | Pro (R$9,90/mês ou R$79,90/ano) |
|---|---|---|
| Auto-captura | Sim | Sim |
| Formatos básicos (Livre, 1:1) | Sim | Sim |
| Formatos avançados (3x4, 4:5, 5:7, 9:16) | 3 fotos/dia | Ilimitado |
| Download | Com marca d'água sutil | Sem marca d'água |
| Filtros de beleza | - | Sim |
| Filtros artísticos | - | Sim |
| Fotos por sessão | 10 | 50 |
| Qualidade máxima (JPEG 1.0) | - | Sim |

### Fase 3 — Expandido
- Marketplace de acessórios/stickers (óculos, chapéus, props)
- Galeria cloud com sync entre dispositivos
- API para desenvolvedores integrarem auto-captura em seus apps
- Licenciamento B2B (foto-cabines digitais, RH, etc.)

**Ordem de preferência de receita:** Assinatura > Compra de pacotes de filtros > Ads (último recurso — ads degradam a experiência de captura).

---

## 9. Métricas de Sucesso / KPIs

### Engajamento
| Métrica | Target |
|---|---|
| Fotos por sessão | > 5 |
| Duração da sessão | > 2 minutos |
| Taxa de retorno (7 dias) | > 30% |
| Instalações PWA / total de visitas | > 15% |

### Qualidade
| Métrica | Target |
|---|---|
| Taxa de sucesso da auto-captura | > 90% das fotos capturadas são mantidas (não deletadas imediatamente) |
| Tempo até primeira captura | < 8s após permissão de câmera |
| Taxa de crash | < 1% das sessões |

### Crescimento
| Métrica | Target |
|---|---|
| Usuários ativos semanais | Crescimento semana a semana |
| Taxa de compartilhamento orgânico | % de usuários que usam o botão Compartilhar |
| Taxa de concessão de permissão de câmera | > 85% |

### Técnico
| Métrica | Target |
|---|---|
| Tempo de load do MediaPipe | P50 < 3s, P95 < 8s |
| FPS de detecção | > 15 FPS em 90% dos dispositivos |
| Uso de memória | Sem OOM crash em dispositivos com >= 3GB RAM |

**Analytics:** Plausible ou Umami (self-hosted) — privacy-first, alinhado com o posicionamento PWA sem instalação.

---

## 10. Roadmap

### Fase 1: MVP (Semanas 1-3)
- [ ] Scaffold do projeto (Vite + React + TS + Tailwind + PWA plugin)
- [ ] Portar core engine (MediaPipe, ReactMediaPipe, FaceDetectionContext, canvasOptimization)
- [ ] Tela da câmera com auto-captura funcionando
- [ ] Modelos de formato (6 formatos com guia visual)
- [ ] FaceGuide (overlay simplificado com borda de status)
- [ ] Galeria da sessão com thumbnail strip
- [ ] Download individual e em lote (ZIP)
- [ ] Landing page simples
- [ ] PWA (manifest, service worker, ícones)
- [ ] Configurações básicas

### Fase 2: Polish (Semanas 4-5)
- [ ] Melhorias de qualidade (detecção de blur, exposição adaptativa)
- [ ] Onboarding animado (como a auto-captura funciona)
- [ ] Otimização para dispositivos low-end
- [ ] Hardening de compatibilidade iOS Safari
- [ ] Smart banner "Instalar app"

### Fase 3: Filtros (Semanas 6-8)
- [ ] Filtros de beleza client-side (WebGL ou CSS filters)
- [ ] Skin smoothing usando landmarks do MediaPipe (já temos 468 landmarks)
- [ ] Presets de cor (film grain, vintage, portrait)
- [ ] Preview de filtro antes de aplicar

### Fase 4: Social e Compartilhamento (Semanas 9-10)
- [ ] Compartilhamento direto para Instagram Stories, WhatsApp, Twitter
- [ ] Link de galeria compartilhável (requer backend mínimo)
- [ ] Modo colagem (combinar múltiplas auto-capturas em grid)

### Fase 5: Cloud e Monetização (Semanas 11-14)
- [ ] Contas de usuário (email/Google sign-in)
- [ ] Galeria cloud com sync entre dispositivos
- [ ] Billing por assinatura (Stripe)
- [ ] Filtros e acessórios premium
- [ ] Sistema de watermark para tier free

### Fase 6: IA Avançada (Pós-lançamento)
- [ ] Detecção de expressão (capturar quando sorrindo)
- [ ] Modo selfie em grupo (detectar múltiplos rostos)
- [ ] Seleção inteligente (auto-pick a melhor foto de uma sequência)
- [ ] Blur/substituição de fundo via estimativa de profundidade

---

## 11. Riscos e Mitigações

### Riscos Técnicos

| Risco | Severidade | Probabilidade | Mitigação |
|---|---|---|---|
| WASM do MediaPipe (11.4MB) causa load lento | Alta | Alta | Loading animation engajante; cache agressivo via service worker; hospedar WASM em CDN próprio com compressão |
| Quirks do iOS Safari com WebRTC | Alta | Média | Já parcialmente tratado no código existente (`setupVideoWithEvents`). Testar em iOS 16+. Limitações de PWA no iOS são aceitas no MVP |
| Falha de GPU em chipsets específicos | Média | Média | Já mitigado: código usa CPU delegate universalmente após issue do Samsung S25 |
| Pressão de memória em dispositivos low-end | Média | Média | `getAdaptiveResolution()` escala resolução por `navigator.deviceMemory`. Galeria limitada a 50 fotos. Blob URLs revogados ao deletar |
| UX de permissão de câmera varia entre browsers | Média | Alta | Tela clara de request explicando por que a câmera é necessária. Detectar `NotAllowedError` e mostrar instruções por plataforma |

### Riscos de Produto

| Risco | Severidade | Probabilidade | Mitigação |
|---|---|---|---|
| Usuários acham auto-captura irritante ou prematura | Alta | Média | Countdown configurável (1-3s). Botão de pause. Cooldown entre capturas. Threshold de estabilidade previne capturas acidentais |
| Percepção "pra que se tenho câmera nativa?" | Alta | Alta | Landing page comunica valor claramente. Vídeo demo do workflow hands-free. Focar em use cases: hands-free, acessibilidade, batch selfies, foto documento |
| Limitações de PWA no iOS (sem push, install limitado) | Média | Certa | Aceitar no MVP. Core camera feature funciona. Capacitor (wrapper nativo) é opção futura |
| Fotos perdidas ao fechar (session-only) | Média | Média | Comunicação clara que fotos são da sessão. Botão "Download All" proeminente. `beforeunload` event sugere download |

### Riscos de Negócio

| Risco | Severidade | Probabilidade | Mitigação |
|---|---|---|---|
| Difícil monetizar app de câmera utilitário | Média | Média | Filtros de beleza têm willingness-to-pay comprovada. Formato 3x4 é alternativa a serviço pago (R$15-30). Focar em qualidade primeiro, monetizar depois |
| Baixa retenção para app utilitário | Média | Alta | "Selfie do dia" streak/reminder (pós-MVP). Galeria cloud cria lock-in. Features sociais criam network effects |
| Apple/Google adicionam auto-captura nas câmeras nativas | Alta | Baixa | Mover rápido em features únicas (detecção de expressão, seleção inteligente). Construir base de usuários leal. Manter vantagens de PWA |

---

## 12. Decisões Técnicas Importantes (Herdadas do OneDocs)

Estas decisões foram validadas em produção e devem ser mantidas:

1. **CPU Delegate (não GPU):** GPU falha em Samsung S25 (Snapdragon 8 Elite) e Tab S9 (Snapdragon 8 Gen 2). CPU é 20-30 FPS mas funciona em 100% dos dispositivos.

2. **Histerese na detecção de direção:** Sistema de hysteresis com dead zone de 10° previne flickering quando o rosto está perto de boundaries de decisão.

3. **Duas validações separadas:** `isVisuallyValid` (feedback UI responsivo) e `isCaptureValid` (trigger de captura estável) resolvem o conflito entre responsividade e precisão.

4. **Canvas `willReadFrequently: true`:** Patch global que elimina warnings de performance no Chrome e melhora FPS em dispositivos como Zenfone 8.

5. **Resolução adaptativa:** `getAdaptiveResolution()` ajusta resolução da câmera baseado em `navigator.deviceMemory` — previne OOM em dispositivos com pouca RAM.

6. **Event-driven video setup:** Usa events (`loadedmetadata`, `canplay`) com timeout fallback ao invés de polling — resolve problemas em dispositivos que demoram para inicializar a câmera.

---

## 13. Ordem de Implementação Recomendada (MVP)

Para um desenvolvedor solo, a sequência recomendada:

1. **Scaffold:** `npm create vite@latest snapface -- --template react-ts` + Tailwind + PWA plugin. Copiar script postinstall de WASM do `package.json` existente.

2. **Portar core engine:** Copiar e limpar `MediaPipeFaceDetection.ts`, `ReactMediaPipe.tsx`, `FaceDetectionContext.tsx`, `canvasOptimization.ts`, `useAutoCapture.ts`, `useWakeLock.ts`, constantes. Remover dependências OneDocs.

3. **CameraPage funcional:** Integrar engine portado. Auto-captura produz JPEG blob. **Esse é o caminho crítico** — tudo depende disso funcionar.

4. **FaceGuide + FormatGuide:** Overlay simplificado com borda de status + guia do formato selecionado.

5. **FormatSelector + formatProcessor:** Seletor de formato + lógica de crop por formato (generalizar `processImageTo3x4HighRes`).

6. **Galeria da sessão:** `useSessionGallery` + `ThumbnailStrip` + `PhotoPreview`.

7. **Download:** Individual + "Download All" como ZIP (JSZip).

8. **Landing page:** Hero simples com CTA.

9. **PWA:** Manifest, service worker, ícones, splash screens.

10. **Teste:** Cross-browser (Chrome Android, Safari iOS, Chrome Desktop, Firefox), cross-device (low-end, mid-range, flagship).

---

*Documento gerado em 12 de junho de 2026. Baseado na tecnologia do OneDocs Capture Selfie.*

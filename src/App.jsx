import { useState } from 'react'
import { QRCode } from 'react-qr-code'
import bg from './assets/bg_arco.png'
import logoDne from './assets/logo_dne.png'
import logoUe from './assets/logo_ue.png'
import logoUnip from './assets/LOGO_UNIP.png'
import icone from './assets/ICONE.png'
import iconeMeiaEntrada from './assets/ICONE_MEIA_ENTRADA.png'
import { IoCopyOutline } from 'react-icons/io5'
import photoAna from './assets/ana.png'


// ─────────────────────────────────────────────────────────────────────────────
// Dados dos estudantes
// Cada um tem um `token` único que compõe a URL de validação:
//   /VALIDATE/<urlName>/<type>/<rg>/<token>
// Quando essa URL é acessada, exibe a tela de validação (sem splash, sem card).
// ─────────────────────────────────────────────────────────────────────────────
const students = {
  ANDRE: {
    id: 1,
    key: 'A',
    urlName: 'ANA',
    type: 'UNIP',
    name: 'ANA LÚCIA LOPES DE MORAIS',
    cpf: '471.948.508-18',
    rg: '45.946.716-6',
    dataNas: '16/12/1996',
    inst: 'Universidade Paulista – UNIP',
    campus: 'CAMPINAS-SWIFT',
    nivel: 'Superior',
    curso: 'Análise e Desenvolvimento de Sistemas',
    validade: 'Março de 2027',
    dneCode: 'A966FJ8',
    token: 'a1b2c3d4-11aa-4e1c-b0e1-1a2b3c4d5e6f',
    photo: photoAna,
  },
}

// Índice reverso: token → estudante
const studentsByToken = Object.fromEntries(
  Object.values(students).map(s => [s.token, s])
)

// Índice por chave curta (localStorage legado)
const studentsByKey = Object.fromEntries(
  Object.values(students).map(s => [s.key, s])
)

const pems = {
  A: `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
2026732123510000474805968ANDRENICOLANUNES
UISmJHTYkdjnSzKqLpXvWbNcRoefMgA1uVxP3z+
Qk9lF8dBe7rGyHwCmOtaVnD0pZs6YKTiXjU4eL
curso:EngElétrica/inst:UNISAL/val:032027=
YWxpZGFkZTpNYXLDp28gZGUgMjAyNw==`,
  J: `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
2026904155770000471713828JULIASIQUEIRACRE
MPZkRqWxNvLsTdYhBgUoAeXcIfKpJ2mV7r4n8s+
Fb3eG9aChDwEltOmYuPqR1sZ5jHkXiT6yN0WdB
curso:Psicologia/inst:UNIP/val:032027===
aW5zdDpVTklQL3ZhbDpNYXLDp28gZGUgMjAyNw==`,
  L: `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
2026174533900000058113299LEONARDOSIQUEIRA
CARRENHOxPqWmZkRvLsTdYhBgUoAeXcIfJ2nV7+
Gb4fH0bDiEwFlvNnZuQrS2tA6kIlYjU7yO1XeC
curso:Direito/inst:FAM/val:032027=======
Y3Vyc286RGlyZWl0by9pbnN0OkZBTQ==`,
}

// Padding usado SÓ para aumentar a densidade do QR Code (mais módulos).
// É anexado ao final da URL e ignorado pelo parser.
const QR_PADDING = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30'

// ── URL parser ────────────────────────────────────────────────────────────────
// Novo:  /VALIDATE/<NOME>/<TYPE>/<RG>/<token>[/<padding>]
//        ex: /VALIDATE/JULIA/UNIP/481234567/f9e8d7c6-.../AHJS...
//        Segmentos extras após o token são ignorados (padding visual do QR).
// Velho: /<NOME>/<TYPE>/<token>                 (mantido por compatibilidade)
function parseRoute() {
  const parts = window.location.pathname.replace(/^\//, '').split('/').filter(Boolean)

  if (parts[0]?.toUpperCase() === 'VALIDATE' && parts.length >= 5) {
    const [, urlName, type, rg, token] = parts
    return {
      mode: 'VALIDATE',
      urlName: urlName.toUpperCase(),
      type: type.toUpperCase(),
      rg,
      token,
    }
  }

  if (parts.length >= 3 && parts[0] && parts[2]) {
    const [urlName, type, token] = parts
    return {
      mode: 'LEGACY',
      urlName: urlName.toUpperCase(),
      type: type.toUpperCase(),
      token,
    }
  }
  return null
}

const onlyDigits = (s) => (s || '').replace(/\D/g, '')

// ── Seleção ───────────────────────────────────────────────────────────────────
function SelectionScreen({ onSelect }) {
  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#E8EBF5',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1.25rem', fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <img src={icone} alt="Ícone" style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '12px' }} />
      <p style={{ color: '#6b7280', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: '600', margin: '0 0 28px' }}>
        Selecione o estudante
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '360px' }}>
        {Object.values(students).map(s => (
          <button key={s.key} onClick={() => onSelect(s.key)} style={{
            background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '18px',
            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px',
            cursor: 'pointer', textAlign: 'left', width: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid #E8EBF5' }}>
              <img src={s.photo} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, color: '#22252c', fontSize: '13px', fontWeight: '700' }}>
                {s.name.split(' ').slice(0, 2).join(' ')}
              </p>
              <p style={{ margin: '2px 0 0', color: '#9ca3af', fontSize: '11px' }}>
                {s.curso} · {s.type}
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Certificado ───────────────────────────────────────────────────────────────
function CertificadoScreen({ student, onBack }) {
  const [copied, setCopied] = useState(false)
  const pem = pems[student.key]
  const pemFull = `-----BEGIN CERTIFICATE-----\n${pem}\n-----END CERTIFICATE-----`

  const handleCopy = () => {
    navigator.clipboard.writeText(pemFull).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#E8EBF5', fontFamily: "'Segoe UI', system-ui, sans-serif", padding: '24px 20px 40px' }}>
      <p style={{ fontSize: '14px', fontWeight: '400', color: '#22252c', margin: '0 0 16px' }}>Certificado</p>
      <img src={iconeMeiaEntrada} alt="Meia Entrada" style={{ width: '160px', height: '100px', objectFit: 'contain', display: 'block', marginLeft: -16 }} />
      <p style={{ fontSize: '16px', fontWeight: '400', color: '#22252c', textAlign: 'left', lineHeight: '1.6', margin: '0 0 16px' }}>
        UE atesta que {student.name} é estudante e está regularmente matriculado(a) em {student.curso} da {student.inst}
      </p>
      <div style={{ width: '100%' }}>
        <div style={{ backgroundColor: '#f97316', borderRadius: '12px 12px 0 0', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#fff', fontWeight: '400', fontSize: '13px' }}>Certificado de atributo (PEM)</span>
          <button onClick={handleCopy} style={{ background: 'none', border: 'none', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#fff', fontSize: '13px', fontWeight: '400' }}>
            <IoCopyOutline size={15} color="#fff" />
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0 0 12px 12px', padding: '16px' }}>
          <p style={{ margin: '0 0 8px', color: '#9ca3af', fontSize: '11px', fontFamily: "'Courier New', monospace", textAlign: 'center', letterSpacing: '0.05em' }}>-----BEGIN CERTIFICATE-----</p>
          <p style={{ margin: '0 0 8px', color: '#22252c', fontSize: '12px', fontFamily: "'Courier New', monospace", lineHeight: '1.7', wordBreak: 'break-all', textAlign: 'left', fontWeight: '400', padding: '0 4px' }}>{pem}</p>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '11px', fontFamily: "'Courier New', monospace", textAlign: 'center', letterSpacing: '0.05em' }}>-----END CERTIFICATE-----</p>
        </div>
      </div>
      <button onClick={onBack} style={{ marginTop: '16px', background: 'none', border: 'none', padding: '0', fontSize: '14px', fontWeight: '400', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
        ← Voltar
      </button>
    </div>
  )
}

// ── CardScreen DNE ────────────────────────────────────────────────────────────
function CardScreenDne({ student, onQrClick }) {
  const validationUrl = `https://unip.up.railway.app/${student.urlName}/DNE/${student.token}/AHJSHTESHDHSADHUWQYESDHASJKDKDWQUWQGDW;DHAFGDDFJDSFGIFUSAUFGUDSAOFUSIDFVSADF`

  return (
    <div style={{ minHeight: '100vh', backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', boxSizing: 'border-box' }}>
        <img src={logoDne} alt="DNE" style={{ height: '70px', objectFit: 'contain' }} />
        <img src={logoUe} alt="UE" style={{ height: '70px', objectFit: 'contain' }} />
      </div>

      <div style={{ display: 'flex', gap: '12px', padding: '0 16px', marginTop: '16px' }}>
        <div style={{ flex: '0 0 48%', height: '280px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.18)' }}>
          <img src={student.photo} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
        </div>

        <div onClick={onQrClick}
          style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 8px', gap: '6px', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)' }}
        >
          <QRCode value={validationUrl} size={120} bgColor="#ffffff" fgColor="#0a0a0a" />
          <span style={{ fontSize: '10px', color: '#6b7280', textAlign: 'center', lineHeight: '1.3' }}>Cód. de uso DNE</span>
          <strong style={{ fontSize: '12px', color: '#111827', textAlign: 'center' }}>{student.dneCode}</strong>
        </div>
      </div>

      <div style={{ margin: '12px 16px 24px', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.18)', padding: '16px 20px 18px', textAlign: 'left' }}>
        <div style={{ fontWeight: '800', fontSize: '22px', marginBottom: '22px', color: '#22252c', letterSpacing: '0.02em' }}>{student.name}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', lineHeight: '1.5' }}>
          <div style={{ color: '#22252c' }}>Ins. Ensino: {student.inst}</div>
          <div style={{ color: '#22252c' }}>Campus: {student.campus}</div>
          <div style={{ color: '#22252c' }}>Curso: {student.curso}</div>
          <div style={{ color: '#22252c' }}>Nível: {student.nivel}</div>
          <div style={{ color: '#22252c' }}>CPF: {student.cpf}</div>
          <div style={{ color: '#22252c' }}>Data nas.: {student.dataNas}</div>
          <div style={{ color: '#22252c' }}>Validade: {student.validade}</div>
        </div>
      </div>
    </div>
  )
}

// ── CardScreen UNIP ───────────────────────────────────────────────────────────
function CardScreenUnip({ student, onQrClick }) {
  const validationUrl = `https://unip.up.railway.app/VALIDATE/${student.urlName}/UNIP/${onlyDigits(student.rg)}/${student.token}/${QR_PADDING}`

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#E8EBF5', fontFamily: "'Segoe UI', system-ui, sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* Header gradient */}
      <div style={{ background: 'linear-gradient(180deg, #1E3672 0%, #2A4B9B 100%)', borderRadius: '0 0 32px 32px', padding: '28px 20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', boxShadow: '0 8px 32px rgba(30,54,114,0.30)'}}>

        <img src={logoUnip} alt="UNIP" style={{ height: '100px', objectFit: 'contain' }} />

        {/* Card translúcido com foto + dados */}
        <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: '8px', padding: '14px', display: 'flex', gap: '14px', alignItems: 'stretch', width: '90%' }}>

          {/* Foto */}
          <div style={{ flexShrink: 0, width: '90px', height: '116px', overflow: 'hidden', borderRadius: '6px' }}>
            <img src={student.photo} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block', filter: 'blur(0.4px) contrast(0.92) saturate(0.85) brightness(0.97)' }} />
          </div>

          {/* Dados */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px', justifyContent: 'center' }}>
            <InfoRow label="Nome"      value={student.name.toUpperCase()} />
            <InfoRow label="Matrícula" value={student.dneCode.replace(/\./g, '').toUpperCase()} />
            <InfoRow label="RG"       value={student.rg.toUpperCase()} />
            <InfoRow label="Campus"    value={student.campus.toUpperCase()} />
            <InfoRow label="Curso"     value={student.curso.toUpperCase()} />
            <InfoRow label="Validade"  value={student.validade.toUpperCase()} />
          </div>
        </div>
      </div>

      {/* QR Code – apenas o código, sem texto */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
        <div onClick={onQrClick}
          style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '12px', boxShadow: '0 4px 24px rgba(30,54,114,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(30,54,114,0.22)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(30,54,114,0.13)' }}
        >
          <QRCode value={validationUrl} size={200} bgColor="#ffffff" fgColor="#000000" />
        </div>
      </div>
    </div>
  )
}

// ── InfoRow helper ────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div style={{ lineHeight: '1.2', textAlign: 'left', wordBreak: 'break-word' }}>
      <span style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff', fontFamily: 'Arial' }}>
        {label}:{' '}
      </span>
      <span style={{ fontSize: '13px', color: '#ffffff', fontFamily: 'Arial' }}>
        {value}
      </span>
    </div>
  )
}

// ── Tela de Validação (estilo sistema acadêmico antigo) ──────────────────────
const labelCell = { padding: '5px 9px', backgroundColor: '#e8e8e8', borderBottom: '1px solid #c0c0c0', borderRight: '1px solid #c0c0c0', fontWeight: 'bold', width: '120px', color: '#333', verticalAlign: 'top', fontSize: '11px' }
const valueCell = { padding: '5px 9px', borderBottom: '1px solid #c0c0c0', color: '#000', fontSize: '12px' }

function RetroHeader() {
  return (
    <div style={{ background: 'linear-gradient(180deg, #003B7A 0%, #002a59 100%)', borderBottom: '4px solid #FFC700', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <img src={logoUnip} alt="UNIP" style={{ height: '40px', filter: 'brightness(0) invert(1)' }} />
      <div style={{ color: '#fff', lineHeight: '1.3' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.5px' }}>SISTEMA DE VALIDAÇÃO DE CARTEIRA ESTUDANTIL</div>
        <div style={{ fontSize: '10px', color: '#aac3e0' }}>Universidade Paulista – UNIP &nbsp;|&nbsp; Pró-Reitoria de Graduação</div>
      </div>
    </div>
  )
}

function ValidationScreen({ student }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('pt-BR')
  const timeStr = now.toLocaleTimeString('pt-BR')
  const protocolo = `${student.token.substring(0, 8).toUpperCase()}-${now.getFullYear()}`

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#d4d0c8', fontFamily: 'Verdana, Arial, Helvetica, sans-serif', padding: '10px', color: '#000', fontSize: '12px' }}>
      <RetroHeader />

      <div style={{ backgroundColor: '#fff', borderLeft: '1px solid #999', borderRight: '1px solid #999', padding: '5px 10px', fontSize: '10px', color: '#666' }}>
        Início &gt; Serviços ao Aluno &gt; Validação de Carteira Estudantil
      </div>

      <div style={{ backgroundColor: '#dff0d8', border: '1px solid #5cb85c', borderTop: 'none', color: '#2d5d2d', padding: '10px 12px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>✓ CARTEIRA VÁLIDA</div>
        <div style={{ fontSize: '11px', marginTop: '3px' }}>O aluno consultado encontra-se regularmente matriculado nesta instituição.</div>
      </div>

      <div style={{ backgroundColor: '#003B7A', color: '#fff', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', marginTop: '8px', letterSpacing: '0.5px' }}>
        DADOS DO ALUNO
      </div>
      <div style={{ display: 'flex', backgroundColor: '#fff', border: '1px solid #999', borderTop: 'none' }}>
        <div style={{ padding: '10px', borderRight: '1px solid #c0c0c0', backgroundColor: '#f5f5f5', textAlign: 'center' }}>
          <img src={student.photo} alt={student.name} style={{ width: '100px', height: '130px', objectFit: 'cover', objectPosition: 'center top', border: '1px solid #999', display: 'block' }} />
          <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>FOTO 3x4</div>
        </div>
        <table style={{ flex: 1, borderCollapse: 'collapse' }}>
          <tbody>
            <tr><td style={labelCell}>Nome</td><td style={valueCell}>{student.name}</td></tr>
            <tr><td style={labelCell}>Matrícula</td><td style={valueCell}>{student.dneCode.replace(/\./g, '')}</td></tr>
            <tr><td style={labelCell}>CPF</td><td style={valueCell}>{student.cpf}</td></tr>
            {student.rg && <tr><td style={labelCell}>RG</td><td style={valueCell}>{student.rg}</td></tr>}
            <tr><td style={labelCell}>Nascimento</td><td style={{...valueCell, borderBottom: 'none'}}>{student.dataNas}</td></tr>
          </tbody>
        </table>
      </div>

      <div style={{ backgroundColor: '#003B7A', color: '#fff', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', marginTop: '8px', letterSpacing: '0.5px' }}>
        DADOS ACADÊMICOS
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', border: '1px solid #999', borderTop: 'none' }}>
        <tbody>
          <tr><td style={labelCell}>Instituição</td><td style={valueCell}>{student.inst}</td></tr>
          <tr><td style={labelCell}>Campus</td><td style={valueCell}>{student.campus}</td></tr>
          <tr><td style={labelCell}>Curso</td><td style={valueCell}>{student.curso}</td></tr>
          <tr><td style={labelCell}>Nível</td><td style={valueCell}>{student.nivel}</td></tr>
          <tr><td style={labelCell}>Validade</td><td style={{...valueCell, borderBottom: 'none', fontWeight: 'bold'}}>{student.validade}</td></tr>
        </tbody>
      </table>

      <div style={{ marginTop: '10px', padding: '8px 10px', backgroundColor: '#eaeaea', border: '1px solid #c0c0c0', fontSize: '10px', color: '#444', lineHeight: '1.7' }}>
        <div>Consulta realizada em: <strong>{dateStr}</strong> às <strong>{timeStr}</strong></div>
        <div>Protocolo de verificação: <span style={{ fontFamily: 'Courier New, monospace', backgroundColor: '#fff', padding: '1px 4px', border: '1px solid #ccc' }}>{protocolo}</span></div>
        <div style={{ marginTop: '5px', borderTop: '1px dotted #999', paddingTop: '5px', textAlign: 'center', color: '#666' }}>
          © Universidade Paulista – UNIP &nbsp;|&nbsp; Sistema de Identificação Estudantil v2.4.1
        </div>
      </div>
    </div>
  )
}

// ── Tela de token inválido ────────────────────────────────────────────────────
function InvalidScreen() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#d4d0c8', fontFamily: 'Verdana, Arial, Helvetica, sans-serif', padding: '10px', color: '#000', fontSize: '12px' }}>
      <RetroHeader />
      <div style={{ backgroundColor: '#f2dede', border: '1px solid #d9534f', borderTop: 'none', color: '#a94442', padding: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>✗ CARTEIRA INVÁLIDA</div>
        <div style={{ fontSize: '11px', marginTop: '4px' }}>O código consultado não corresponde a nenhum aluno regularmente matriculado nesta instituição.</div>
      </div>
      <div style={{ marginTop: '10px', padding: '8px 10px', backgroundColor: '#eaeaea', border: '1px solid #c0c0c0', fontSize: '10px', color: '#666', textAlign: 'center' }}>
        © Universidade Paulista – UNIP &nbsp;|&nbsp; Sistema de Identificação Estudantil v2.4.1
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [showCert, setShowCert] = useState(false)

  // Detecta rota de validação: /VALIDATE/<NOME>/<TYPE>/<RG>/<token>
  const route = parseRoute()
  const validationStudent = route?.token ? studentsByToken[route.token] : null
  const isValidationRoute = route !== null

  const [studentKey, setStudentKey] = useState(() => {
    if (isValidationRoute) return null
    const params = new URLSearchParams(window.location.search)
    const urlKey = (params.get('s') || '').toUpperCase()
    if (urlKey && studentsByKey[urlKey]) {
      localStorage.setItem('studentKey', urlKey)
      return urlKey
    }
    return localStorage.getItem('studentKey') || null
  })

  // ── Rota de validação pública ──────────────────────────────────────────────
  if (isValidationRoute) {
    if (!validationStudent) return <InvalidScreen />
    if (route.mode === 'VALIDATE') {
      const nameOk = validationStudent.urlName === route.urlName
      const rgOk   = onlyDigits(validationStudent.rg) === onlyDigits(route.rg)
      const typeOk = validationStudent.type === route.type
      if (!nameOk || !rgOk || !typeOk) return <InvalidScreen />
    }
    return <ValidationScreen student={validationStudent} />
  }

  // ── Fluxo normal do app ────────────────────────────────────────────────────
  const handleSelect = (key) => {
    localStorage.setItem('studentKey', key)
    setStudentKey(key)
  }

  const student = studentKey ? studentsByKey[studentKey] : null

  if (!student) {
    return <SelectionScreen onSelect={handleSelect} />
  }

  const renderCard = () => {
    if (student.type === 'UNIP') {
      return <CardScreenUnip student={student} onQrClick={() => setShowCert(true)} />
    }
    return <CardScreenDne student={student} onQrClick={() => setShowCert(true)} />
  }

  return showCert
    ? <CertificadoScreen student={student} onBack={() => setShowCert(false)} />
    : renderCard()
}
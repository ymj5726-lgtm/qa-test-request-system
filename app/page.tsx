'use client'

import { useEffect, useState } from 'react'

// Supabase 클라이언트 라이브러리를 위한 전역 변수
let supabase: any = null

// 🏢 제조처/납품처 프리셋 목록
const manufacturerList = [
  '(주)파마코스텍',
  'SDC',
  '솔루스첨단소재',
  'SKMJ',
  '동진쎄미켐'
]

// 🧪 채취량 프리셋 목록
const sampleQtyList = ['2g', '3g', '4g', '100mL']

export default function Home() {
  const [activeTab, setActiveTab] = useState('request')

  const [requester, setRequester] = useState('')
  const [lotNo, setLotNo] = useState('')
  const [sampleType, setSampleType] = useState('액체원료')
  const [requestList, setRequestList] = useState<any[]>([])

  const [judgement, setJudgement] = useState('')
  const [labelQty, setLabelQty] = useState('없음')
  const [manufacturerSupplier, setManufacturerSupplier] = useState('(주)파마코스텍') 
  const [containerQty, setContainerQty] = useState('')
  const [totalQty, setTotalQty] = useState('')
  const [remarks, setRemarks] = useState('')
  const today = new Date().toISOString().split('T')[0]
  const [productName, setProductName] = useState('O0330')
  const [manufactureDate, setManufactureDate] = useState(today)
  const [requestDate, setRequestDate] = useState(today)
  const [department, setDepartment] = useState('음성공장 합성팀')
  const [judgementDate, setJudgementDate] = useState(today)
  const [isDbReady, setIsDbReady] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)

  const [sampleQty, setSampleQty] = useState('2g')
  const [isCustomSampleQty, setIsCustomSampleQty] = useState(false)

  const [searchProduct, setSearchProduct] = useState('')
  const [searchType, setSearchType] = useState('')

  const [ledgerPage, setLedgerPage] = useState(1)
  const [resultPage, setResultPage] = useState(1)
  const itemsPerPage = 15

  const [editingId, setEditingId] = useState<any>(null)
  const [editFields, setEditFields] = useState<any>({})

  const [isCustomManufacturer, setIsCustomManufacturer] = useState(false)

  // DB 정보
  const SUPABASE_URL = 'https://ksuyhgnpiqnytafmabai.supabase.co'
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdXloZ25waXFueXRhZm1hYmFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMTMyOTksImV4cCI6MjA5NDY4OTI5OX0.keZTkm7kWzq6ftrDo3xNZEImnWZnUT8CXYl2vDzkg_M'

  useEffect(() => {
    const loadSupabase = async () => {
      if (typeof window !== 'undefined') {
        if ((window as any).supabase) {
          initSupabase()
          return
        }
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
        script.async = true
        script.onload = () => initSupabase()
        script.onerror = () => {
          setDbError('데이터베이스 라이브러리를 불러오지 못했습니다.')
        }
        document.body.appendChild(script)
      }
    }
    loadSupabase()
  }, [])

  const initSupabase = () => {
    try {
      const supabaseJS = (window as any).supabase
      if (supabaseJS) {
        supabase = supabaseJS.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        setIsDbReady(true)
        fetchData()
      } else {
        setIsDbReady(true)
        setDbError('Supabase 라이브러리 로드 오류')
      }
    } catch (error) {
      setDbError('데이터베이스 초기화 에러')
    }
  }

  const fetchData = async () => {
    if (!supabase) return
    setDbError(null)
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      setRequestList(data || [])
    } catch (error: any) {
      setDbError('데이터 로드 실패')
    }
  }

  const generateRequestNo = (currentSampleType: string, targetDate: string, currentList: any[]) => {
    if (!targetDate) return ''
    const cleanDate = targetDate.replace(/[^0-9]/g, '')
    const datePart = cleanDate.substring(2, 8) 
    let prefixMap: { [key: string]: string } = { 액체원료: 'ER', 고체원료: 'ER', 제품: 'EP', 중간체: 'EB' }
    let prefix = prefixMap[currentSampleType] || 'ER'
    const fullPattern = prefix + datePart 
    const list = Array.isArray(currentList) ? currentList : []
    const sameDayCount = list.filter((item) =>
      item && item.requestNo && item.requestNo.startsWith(fullPattern)
    ).length
    const serial = String(sameDayCount + 1).padStart(2, '0')
    return `${fullPattern}${serial}`
  }

  const saveData = async () => {
    if (!supabase) return alert('데이터베이스 준비 안됨')
    try {
      const { data: latestData, error: fetchError } = await supabase.from('requests').select('*').order('created_at', { ascending: true })
      if (fetchError) throw fetchError
      
      const currentList = latestData || []
      setRequestList(currentList)

      const autoRequestNo = generateRequestNo(sampleType, requestDate, currentList)
      const autoReportNo = `Q${autoRequestNo}`

      const newItem = {
        requester: requester || '',
        productName: productName || 'O0330',
        lotNo: lotNo || '',
        sampleType: sampleType || '액체원료',
        manufacturerSupplier: manufacturerSupplier || '',
        manufactureDate: manufactureDate || today,
        containerQty: containerQty || '',
        totalQty: totalQty || '',
        requestDate: requestDate || today,
        department: department || '음성공장 합성팀',
        remarks: remarks || '',
        judgementDate: judgementDate || today,
        judgement: judgement || '',
        labelQty: labelQty || '없음',
        requestNo: autoRequestNo,
        reportNo: autoReportNo,
        sampleQty: sampleQty || '',
      }

      const { error: insertError } = await supabase.from('requests').insert([newItem])
      if (insertError) throw insertError

      await fetchData()
      alert(`저장 완료\n의뢰번호: ${autoRequestNo}\n성적번호: ${autoReportNo}`)
      
      // 폼 리셋
      setRequester(''); setProductName('O0330'); setLotNo(''); setSampleType('액체원료');
      setManufacturerSupplier('(주)파마코스텍'); setIsCustomManufacturer(false);
      setContainerQty(''); setTotalQty(''); setRemarks('');
      setSampleQty('2g'); setIsCustomSampleQty(false);
    } catch (error: any) {
      alert(`저장 실패: ${error.message}`)
    }
  }

  const deleteItem = async (id: any, index: number) => {
    if (!supabase) return
    const confirmDelete = window.confirm('선택한 의뢰를 삭제하시겠습니까?')
    if (!confirmDelete) return
    try {
      const { error } = await supabase.from('requests').delete().eq('id', id)
      if (error) throw error
      const updatedList = requestList.filter((_, i) => i !== index)
      setRequestList(updatedList)
    } catch (error: any) {
      alert('삭제 실패')
    }
  }

  const updateResult = async (id: any, field: string, value: string) => {
    if (!supabase) return
    try {
      const { error } = await supabase.from('requests').update({ [field]: value }).eq('id', id)
      if (error) throw error
      const updatedList = requestList.map(item => item.id === id ? { ...item, [field]: value } : item)
      setRequestList(updatedList)
    } catch (error: any) {
      alert('수정 실패')
    }
  }

  const startEditing = (item: any) => {
    setEditingId(item.id)
    setEditFields({ ...item })
  }

  const handleEditChange = (field: string, value: string) => {
    setEditFields((prev: any) => ({ ...prev, [field]: value }))
  }

  const saveEditing = async (id: any) => {
    if (!supabase) return
    try {
      const { error } = await supabase.from('requests').update({
        requester: editFields.requester, productName: editFields.productName, lotNo: editFields.lotNo,
        sampleType: editFields.sampleType, manufacturerSupplier: editFields.manufacturerSupplier,
        manufactureDate: editFields.manufactureDate, containerQty: editFields.containerQty,
        totalQty: editFields.totalQty, requestDate: editFields.requestDate, department: editFields.department,
        remarks: editFields.remarks, sampleQty: editFields.sampleQty,
      }).eq('id', id)
      if (error) throw error
      await fetchData()
      setEditingId(null)
      alert('수정 완료')
    } catch (error: any) {
      alert('수정 실패')
    }
  }

  const getFilteredRequests = () => {
    return requestList.filter((item) => {
      const productMatch = !searchProduct || item.productName?.toLowerCase().includes(searchProduct.toLowerCase())
      const typeMatch = !searchType || item.sampleType === searchType
      return productMatch && typeMatch
    })
  }

  const downloadExcel = () => {
    const filteredData = getFilteredRequests();
    const headers = ["No", "시험항목", "의뢰자", "의뢰일", "의뢰번호", "성적번호", "품명", "제조번호", "제조자/납품자", "채취량", "제조/입고 일자", "용기수량", "입고수량", "의뢰부서", "비고"];
    const formatCell = (cell: any) => {
      let value = String(cell || "");
      const quote = String.fromCharCode(34);
      if (value.includes(quote)) value = value.replace(new RegExp(quote, 'g'), quote + quote);
      if (value.includes(',') || value.includes(quote) || value.includes('\n')) return quote + value + quote;
      return value;
    };
    const csvRows = filteredData.map((item, index) => [
      index + 1, formatCell(item.sampleType), formatCell(item.requester), formatCell(item.requestDate), formatCell(item.requestNo), formatCell(item.reportNo),
      formatCell(item.productName), formatCell(item.lotNo), formatCell(item.manufacturerSupplier), formatCell(item.sampleQty),
      formatCell(item.manufactureDate), formatCell(item.containerQty), formatCell(item.totalQty), formatCell(item.department), formatCell(item.remarks)
    ].join(',')).join('\n');

    const csvContent = "\uFEFF" + headers.join(',') + "\n" + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '접수대장.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    // 🎨 수정사항 2: 부모 컨테이너에 relative 속성을 주고, 내부에 워터마크 이미지 영역을 절대 위치(absolute)로 깔아줍니다.
    <div className="p-10 max-w-6xl mx-auto relative min-h-screen">
      
      {/* 🌟 워터마크 영역 (투명도 opacity-5, 마우스 클릭 통과 pointer-events-none) */}
      <div className="absolute inset-0 z-[-1] flex items-center justify-center pointer-events-none opacity-[0.05]">
        {/* public 폴더에 로고 이미지를 logo.png 로 넣으면 모든 탭의 배경화면 중앙에 연하게 나타납니다. */}
        <img src="/logo.png" alt="회사 워터마크" className="w-[600px] h-auto grayscale" />
      </div>

      <div className="flex items-center gap-4 mb-6">
        <img 
          src="/logo.png" 
          alt="PHARMACOS Logo" 
          className="h-12 w-auto object-contain" 
          onError={(e) => (e.currentTarget.style.display = 'none')} 
        />
        <h1 className="text-3xl font-bold mb-8 relative z-10">시험 의뢰 관리 시스템 (Supabase)</h1>
      </div>
      
      {!isDbReady && !dbError && (
        <div className="bg-yellow-50 text-yellow-800 p-3 rounded mb-6 text-sm border border-yellow-200">데이터베이스 연결 준비 중...</div>
      )}
      {dbError && (
        <div className="bg-red-50 text-red-800 p-4 rounded mb-6 text-sm border border-red-200 space-y-2">
          <p className="font-bold">⚠️ 데이터베이스 오류</p>
          <pre>{dbError}</pre>
        </div>
      )}

      <div className="flex gap-3 mb-8 relative z-10">
        <button onClick={() => setActiveTab('request')} className={`border px-4 py-2 ${activeTab === 'request' ? 'bg-gray-200 font-bold' : 'bg-white'}`}>시험의뢰</button>
        <button onClick={() => { setActiveTab('ledger'); setLedgerPage(1); setEditingId(null); }} className={`border px-4 py-2 ${activeTab === 'ledger' ? 'bg-gray-200 font-bold' : 'bg-white'}`}>접수대장</button>
        <button onClick={() => { setActiveTab('result'); setResultPage(1); }} className={`border px-4 py-2 ${activeTab === 'result' ? 'bg-gray-200 font-bold' : 'bg-white'}`}>시험결과통보</button>
      </div>

      {/* 🎨 수정사항 1: 의뢰 탭의 UI를 첨부 사진과 같은 표(Table) 형태로 변경 */}
      {activeTab === 'request' && (
        <div className="space-y-6 relative z-10">
          <table className="w-full border-collapse border-2 border-black text-sm text-left">
            <tbody>
              {/* 1행: 품명 / 시험항목 종류 */}
              <tr>
                <th className="border border-black bg-gray-50 p-3 w-1/6 font-semibold text-center">품명</th>
                <td className="border border-black p-0 w-2/6 bg-white/80">
                  <select className="w-full h-full p-2 border-none outline-none bg-white whitespace-nowrap" value={productName} onChange={(e) => setProductName(e.target.value)}>
                    <option value="O0330">O0330</option>
                    <option value="O0711">O0711</option>
                    <option value="O0731">O0731</option>
                    <option value="O0830">O0830</option>
                    <option value="G0720">G0720</option>
                    <option value="LX0556">LX0556</option>
                    <option value="LX0566">LX0566</option>
                    <option value="DCPM-383">DCPM-383</option>
                    <option value="HTM-K940">HTM-K940</option>
                    <option value="LHT-6634">LHT-6634</option>
                    <option value="GP-A079">GP-A079</option>
                    <option value="ACT">ACT</option>
                    <option value="EA">EA</option>
                    <option value="EtOH(99.5%)">EtOH(99.5%)</option>
                    <option value="MC">MC</option>
                    <option value="MCB">MCB</option>
                    <option value="THF">THF</option>
                    <option value="MeOH">MeOH</option>
                    <option value="TOL">TOL</option>
                    <option value="Xylene">Xylene</option>
                    <option value="HEP">HEP</option>
                    <option value="EDC">EDC</option>
                  </select>
                </td>
                <th className="border border-black bg-gray-50 p-3 w-1/6 font-semibold text-center">시험항목 종류</th>
                <td className="border border-black p-0 w-2/6 bg-white/80">
                  <select className="w-full h-full p-2 border-none outline-none bg-white whitespace-nowrap" value={sampleType} onChange={(e) => setSampleType(e.target.value)}>
                    <option value="액체원료">액체원료</option>
                    <option value="고체원료">고체원료</option>
                    <option value="중간체">중간체</option>
                    <option value="제품">제품</option>
                  </select>
                </td>
              </tr>
              
              {/* 2행: 제조번호 / 제조자 및 납품자 */}
              <tr>
                <th className="border border-black bg-gray-50 p-3 font-semibold text-center">제조번호 (Lot No.)</th>
                <td className="border border-black p-0 w-2/6 bg-white/80">
                  <input className="w-full h-full p-2 border-none outline-none bg-white whitespace-nowrap" placeholder="제조번호 입력" value={lotNo} onChange={(e) => setLotNo(e.target.value)} />
                </td>
                <th className="border border-black bg-gray-50 p-3 font-semibold text-center">제조자 / 납품자</th>
                <td className="border border-black p-0 bg-white/80">
                  {!isCustomManufacturer ? (
                    <select
                      className="border p-2 w-full rounded bg-white"
                      value={manufacturerSupplier}
                      onChange={(e) => {
                        if (e.target.value === 'custom_write') {
                          setIsCustomManufacturer(true); setManufacturerSupplier('');
                        } else {
                          setManufacturerSupplier(e.target.value);
                        }
                      }}
                    >
                      <option value="">-- 선택 --</option>
                      {manufacturerList.map((mfg) => <option key={mfg} value={mfg}>{mfg}</option>)}
                      <option value="custom_write">🖋️ 직접 입력</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input className="w-full h-full p-2 border-none outline-none bg-white whitespace-nowrap" placeholder="직접 입력" value={manufacturerSupplier} onChange={(e) => setManufacturerSupplier(e.target.value)} />
                      <button type="button" onClick={() => { setIsCustomManufacturer(false); setManufacturerSupplier('(주)파마코스텍'); }} className="border px-3 py-1 bg-gray-100 rounded text-xs whitespace-nowrap">목록</button>
                    </div>
                  )}
                </td>
              </tr>

              {/* 3행: 용기 수량 / 제조일자 */}
              <tr>
                <th className="border border-black bg-gray-50 p-3 font-semibold text-center">용기 수량</th>
               <td className="border border-black p-0 w-2/6 bg-white/80">
                  <input className="w-full h-full p-2 border-none outline-none bg-white whitespace-nowrap" placeholder="예: 10 Box, 5 D/M" value={containerQty} onChange={(e) => setContainerQty(e.target.value)} />
                </td>
                <th className="border border-black bg-gray-50 p-3 font-semibold text-center">제조 / 입고 일자</th>
               <td className="border border-black p-0 w-2/6 bg-white/80">
                  <select className="w-full h-full p-2 border-none outline-none bg-white whitespace-nowrap" value={manufactureDate} onChange={(e) => setManufactureDate(e.target.value)} />
                </td>
              </tr>

              {/* 4행: 입고 수량 / 의뢰일 */}
              <tr>
                <th className="border border-black bg-gray-50 p-3 font-semibold text-center">제조 / 입고 수량</th>
                <td className="border border-black p-0 w-2/6 bg-white/80">
                  <input className="w-full h-full p-2 border-none outline-none bg-white whitespace-nowrap" placeholder="예: 40,000g, 200kg" value={totalQty} onChange={(e) => setTotalQty(e.target.value)} />
                </td>
                <th className="border border-black bg-gray-50 p-3 font-semibold text-center">의뢰일</th>
              <td className="border border-black p-0 w-2/6 bg-white/80">
                  <select className="w-full h-full p-2 border-none outline-none bg-white whitespace-nowrap" value={requestDate} onChange={(e) => setRequestDate(e.target.value)} />
                </td>
              </tr>

              {/* 5행: 채취량 / 의뢰부서 */}
              <tr>
                <th className="border border-black bg-gray-50 p-3 font-semibold text-center">채취량</th>
                <td className="border border-black p-0 bg-white/80">
                  {!isCustomSampleQty ? (
                    <select
                      className="w-full h-full p-2 border-none outline-none bg-white whitespace-nowrap"
                      value={sampleQty}
                      onChange={(e) => {
                        if (e.target.value === 'custom_qty_write') {
                          setIsCustomSampleQty(true); setSampleQty('');
                        } else {
                          setSampleQty(e.target.value);
                        }
                      }}
                    >
                      {sampleQtyList.map((qty) => <option key={qty} value={qty}>{qty}</option>)}
                      <option value="custom_qty_write">🖋️ 직접 입력</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input className="w-full h-full p-2 border-none outline-none bg-white whitespace-nowrap" placeholder="예: 5g, 10g" value={sampleQty} onChange={(e) => setSampleQty(e.target.value)} />
                      <button type="button" onClick={() => { setIsCustomSampleQty(false); setSampleQty('2g'); }} className="border px-3 py-1 bg-gray-100 rounded text-xs whitespace-nowrap">목록</button>
                    </div>
                  )}
                </td>
                <th className="border border-black bg-gray-50 p-3 font-semibold text-center">의뢰부서</th>
                <td className="border border-black p-0 w-2/6 bg-white/80">
                  <select className="w-full h-full p-2 border-none outline-none bg-white whitespace-nowrap" value={department} onChange={(e) => setDepartment(e.target.value)}>
                    <option value="음성공장 합성팀">음성공장 합성팀</option>
                    <option value="음성공장 품질팀">음성공장 품질팀</option>
                    <option value="화성공장">화성공장</option>
                  </select>
                </td>
              </tr>

              {/* 6행: 의뢰자(채취자) / 빈칸 */}
              <tr>
                <th className="border border-black bg-gray-50 p-3 font-semibold text-center">의뢰자 (채취자)</th>
                <td className="border border-black p-0 w-2/6 bg-white/80">
                  <input className="w-full h-full p-2 border-none outline-none bg-white whitespace-nowrap" placeholder="이름 입력" value={requester} onChange={(e) => setRequester(e.target.value)} />
                </td>
                <th className="border border-black bg-gray-50 p-3 font-semibold text-center"></th>
                {/* 여기에 대각선 빗금 추가 */}
                <td 
                  className="border border-black p-0 bg-white" 
                  style={{ 
                    backgroundImage: 'linear-gradient(to top right, transparent calc(50% - 0.5px), black, transparent calc(50% + 0.5px))' 
                  }}
                ></td>
              </tr>

              {/* 7행: 비고 */}
              <tr>
                <th className="border border-black bg-gray-50 p-3 font-semibold text-center">비고</th>
                <td colSpan={3} className="border border-black p-0 bg-white/80">
                  <input className="w-full h-full p-2 border-none outline-none bg-white whitespace-nowrap" placeholder="비고(참고사항) 입력" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </td>
              </tr>
            </tbody>
          </table>

          <button onClick={saveData} className="bg-black text-white px-4 py-3 hover:bg-gray-800 w-full mt-4 rounded font-bold text-lg shadow-md">
            의뢰서 저장
          </button>
        </div>
      )}

      {/* 접수대장 탭 */}
      {activeTab === 'ledger' && (
        <div className="overflow-x-auto relative z-10 bg-white/80 p-4 rounded border">
          <div className="mb-4 flex gap-3">
            <input type="text" placeholder="품목명 검색" className="border p-2 rounded" value={searchProduct} onChange={(e) => { setSearchProduct(e.target.value); setLedgerPage(1); }} />
            <select className="border p-2 rounded bg-white" value={searchType} onChange={(e) => { setSearchType(e.target.value); setLedgerPage(1); }}>
              <option value="">전체 구분</option><option value="액체원료">액체원료</option><option value="고체원료">고체원료</option><option value="제품">제품</option><option value="중간체">중간체</option>
            </select>
            <button onClick={downloadExcel} className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 ml-2">Excel 다운로드</button>
          </div>

          <table className="w-full border text-sm text-center whitespace-nowrap bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">No.</th><th className="border p-2">시험항목</th><th className="border p-2">의뢰자</th>
                <th className="border p-2">의뢰일</th><th className="border p-2">의뢰번호</th><th className="border p-2">성적번호</th>
                <th className="border p-2">품명</th><th className="border p-2">제조번호</th><th className="border p-2">제조자/납품자</th>
                <th className="border p-2">채취량</th><th className="border p-2">제조/입고 일자</th><th className="border p-2">용기수량</th>
                <th className="border p-2">입고수량</th><th className="border p-2">의뢰부서</th><th className="border p-2">비고</th><th className="border p-2">관리</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filtered = getFilteredRequests()
                const startIndex = (ledgerPage - 1) * itemsPerPage
                const paginated = filtered.slice(startIndex, startIndex + itemsPerPage)
                return paginated.length > 0 ? (
                  paginated.map((item, index) => {
                    const isEditing = editingId === item.id;
                    return (
                      <tr key={item.id || index} className="hover:bg-gray-50">
                        <td className="border p-2">{startIndex + index + 1}</td>
                        <td className="border p-2">{isEditing ? <select className="border p-1 rounded bg-white text-xs" value={editFields.sampleType || ''} onChange={(e) => handleEditChange('sampleType', e.target.value)}><option value="액체원료">액체원료</option><option value="고체원료">고체원료</option><option value="중간체">중간체</option><option value="제품">제품</option></select> : item.sampleType}</td>
                        <td className="border p-2">{isEditing ? <input type="text" className="border p-1 rounded text-xs w-20" value={editFields.requester || ''} onChange={(e) => handleEditChange('requester', e.target.value)} /> : item.requester || '-'}</td>
                        <td className="border p-2">{isEditing ? <input type="date" className="border p-1 rounded text-xs" value={editFields.requestDate || ''} onChange={(e) => handleEditChange('requestDate', e.target.value)} /> : item.requestDate}</td>
                        <td className="border p-2 font-mono text-xs">{item.requestNo}</td>
                        <td className="border p-2 font-mono text-xs">{item.reportNo}</td>
                        <td className="border p-2">{isEditing ? <input type="text" className="border p-1 rounded text-xs w-24" value={editFields.productName || ''} onChange={(e) => handleEditChange('productName', e.target.value)} /> : item.productName}</td>
                        <td className="border p-2">{isEditing ? <input type="text" className="border p-1 rounded text-xs w-28" value={editFields.lotNo || ''} onChange={(e) => handleEditChange('lotNo', e.target.value)} /> : item.lotNo}</td>
                        <td className="border p-2">{isEditing ? <input type="text" className="border p-1 rounded text-xs w-24" value={editFields.manufacturerSupplier || ''} onChange={(e) => handleEditChange('manufacturerSupplier', e.target.value)} /> : item.manufacturerSupplier}</td>
                        <td className="border p-2 text-xs font-semibold">{isEditing ? <input type="text" className="border p-1 rounded text-xs w-16" value={editFields.sampleQty || ''} onChange={(e) => handleEditChange('sampleQty', e.target.value)} /> : item.sampleQty || '-'}</td>
                        <td className="border p-2">{isEditing ? <input type="date" className="border p-1 rounded text-xs" value={editFields.manufactureDate || ''} onChange={(e) => handleEditChange('manufactureDate', e.target.value)} /> : item.manufactureDate}</td>
                        <td className="border p-2">{isEditing ? <input type="text" className="border p-1 rounded text-xs w-20" value={editFields.containerQty || ''} onChange={(e) => handleEditChange('containerQty', e.target.value)} /> : item.containerQty}</td>
                        <td className="border p-2">{isEditing ? <input type="text" className="border p-1 rounded text-xs w-20" value={editFields.totalQty || ''} onChange={(e) => handleEditChange('totalQty', e.target.value)} /> : item.totalQty}</td>
                        <td className="border p-2">{isEditing ? <select className="border p-1 rounded bg-white text-xs" value={editFields.department || ''} onChange={(e) => handleEditChange('department', e.target.value)}><option value="음성공장 합성팀">음성공장 합성팀</option><option value="음성공장 품질팀">음성공장 품질팀</option><option value="화성공장">화성공장</option></select> : item.department}</td>
                        <td className="border p-2">{isEditing ? <input type="text" className="border p-1 rounded text-xs w-32" value={editFields.remarks || ''} onChange={(e) => handleEditChange('remarks', e.target.value)} /> : item.remarks}</td>
                        <td className="border p-2">
                          <div className="flex justify-center gap-1">
                            {isEditing ? (
                              <><button onClick={() => saveEditing(item.id)} className="border bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-xs font-semibold">저장</button><button onClick={() => setEditingId(null)} className="border bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 text-xs">취소</button></>
                            ) : (
                              <><button onClick={() => startEditing(item)} className="border bg-gray-50 text-gray-700 px-2 py-1 rounded hover:bg-gray-150 text-xs font-semibold">수정</button><button onClick={() => deleteItem(item.id, startIndex + index)} className="border bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 text-xs">삭제</button></>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (<tr><td colSpan={16} className="border p-8 text-gray-500">데이터가 존재하지 않습니다.</td></tr>)
              })()}
            </tbody>
          </table>
          {/* 페이지네이션 생략 없이 동일 */}
          {getFilteredRequests().length > itemsPerPage && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button onClick={() => setLedgerPage(prev => Math.max(prev - 1, 1))} disabled={ledgerPage === 1} className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-semibold">이전</button>
              {Array.from({ length: Math.ceil(getFilteredRequests().length / itemsPerPage) }, (_, idx) => (
                <button key={idx + 1} onClick={() => setLedgerPage(idx + 1)} className={`px-3 py-1 border rounded text-sm font-semibold ${ledgerPage === idx + 1 ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}>{idx + 1}</button>
              ))}
              <button onClick={() => setLedgerPage(prev => Math.min(prev + 1, Math.ceil(getFilteredRequests().length / itemsPerPage)))} disabled={ledgerPage === Math.ceil(getFilteredRequests().length / itemsPerPage)} className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-semibold">다음</button>
            </div>
          )}
        </div>
      )}

      {/* 결과통보 탭 */}
      {activeTab === 'result' && (
        <div className="overflow-x-auto relative z-10 bg-white/80 p-4 rounded border">
          <div className="mb-4 flex gap-3">
            <input type="text" placeholder="품목명 검색" className="border p-2 rounded" value={searchProduct} onChange={(e) => { setSearchProduct(e.target.value); setResultPage(1); }} />
            <select className="border p-2 rounded bg-white" value={searchType} onChange={(e) => { setSearchType(e.target.value); setResultPage(1); }}>
              <option value="">전체 구분</option><option value="액체원료">액체원료</option><option value="고체원료">고체원료</option><option value="제품">제품</option><option value="중간체">중간체</option>
            </select>
          </div>

          <table className="w-full border text-center whitespace-nowrap text-sm bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">No.</th>
                <th className="border p-2">시험항목</th>
                <th className="border p-2">성적번호</th>
                <th className="border p-2">품목명</th>
                {/* 🎨 수정사항 3: 담당자 헤더 추가 */}
                <th className="border p-2 bg-blue-50 text-blue-800">담당자</th>
                <th className="border p-2">판정결과</th>
                <th className="border p-2">판정일자</th>
                <th className="border p-2">라벨 발행매수</th>
                <th className="border p-2">삭제</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filtered = getFilteredRequests()
                const startIndex = (resultPage - 1) * itemsPerPage
                const paginated = filtered.slice(startIndex, startIndex + itemsPerPage)

                return paginated.length > 0 ? (
                  paginated.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-gray-50">
                      <td className="border p-2">{startIndex + index + 1}</td>
                      <td className="border p-2">{item.sampleType}</td>
                      <td className="border p-2">{item.reportNo}</td>
                      <td className="border p-2">{item.productName}</td>
                      
                      {/* 🎨 수정사항 3: 담당자 선택 드롭다운 셀 추가 */}
                      <td className="border p-2">
                        <select
                          className="border p-1 w-full rounded bg-white text-blue-700 font-semibold"
                          value={item.manager || ''}
                          onChange={(e) => updateResult(item.id, 'manager', e.target.value)}
                        >
                          <option value="">담당자 선택</option>
                          <option value="김정현">김정현</option>
                          <option value="김현서">김현서</option>
                          <option value="신정수">신정수</option>
                          <option value="이지우">이지우</option>
                        </select>
                      </td>

                      <td className="border p-2">
                        <select className="border p-1 w-full rounded bg-white" value={item.judgement || ''} onChange={(e) => updateResult(item.id, 'judgement', e.target.value)}>
                          <option value="">선택</option><option value="적합">적합</option><option value="부적합">부적합</option>
                        </select>
                      </td>
                      <td className="border p-2">
                        <input type="date" className="border p-1 w-full rounded bg-white" value={item.judgementDate || new Date().toISOString().split('T')[0]} onChange={(e) => updateResult(item.id, 'judgementDate', e.target.value)} />
                      </td>
                      <td className="border p-2">
                        <select className="border p-1 w-full rounded bg-white" value={item.labelQty || '없음'} onChange={(e) => updateResult(item.id, 'labelQty', e.target.value)}>
                          <option value="없음">없음</option>
                          {Array.from({ length: 500 }, (_, i) => (<option key={i + 1} value={String(i + 1)}>{i + 1}매</option>))}
                        </select>
                      </td>
                      <td className="border p-2">
                        <button onClick={() => deleteItem(item.id, startIndex + index)} className="border bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100">삭제</button>
                      </td>
                    </tr>
                  ))
                ) : (<tr><td colSpan={9} className="border p-8 text-gray-500">데이터가 존재하지 않습니다.</td></tr>)
              })()}
            </tbody>
          </table>
          {getFilteredRequests().length > itemsPerPage && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button onClick={() => setResultPage(prev => Math.max(prev - 1, 1))} disabled={resultPage === 1} className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-semibold">이전</button>
              {Array.from({ length: Math.ceil(getFilteredRequests().length / itemsPerPage) }, (_, idx) => (
                <button key={idx + 1} onClick={() => setResultPage(idx + 1)} className={`px-3 py-1 border rounded text-sm font-semibold ${resultPage === idx + 1 ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}>{idx + 1}</button>
              ))}
              <button onClick={() => setResultPage(prev => Math.min(prev + 1, Math.ceil(getFilteredRequests().length / itemsPerPage)))} disabled={resultPage === Math.ceil(getFilteredRequests().length / itemsPerPage)} className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-semibold">다음</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

// Supabase 클라이언트 라이브러리를 위한 전역 변수
let supabase: any = null

// 🏢 요청하신 음성공장 거래 제조처/납품처 프리셋 목록
const manufacturerList = [
  '(주)파마코스텍',
  'SDC',
  '솔루스첨단소재',
  'SKMJ',
  '동진쎄미켐'
]

// 🧪 요청하신 채취량 프리셋 목록
const sampleQtyList = ['2g', '3g', '4g', '100mL']

export default function Home() {
  const [activeTab, setActiveTab] = useState('request')

  const [requester, setRequester] = useState('')
  const [lotNo, setLotNo] = useState('')
  const [sampleType, setSampleType] = useState('액체원료')
  const [requestList, setRequestList] = useState<any[]>([])

  const [judgement, setJudgement] = useState('')
  const [labelQty, setLabelQty] = useState('없음')
  // 첫 번째 제조처인 '(주)파마코스텍'을 기본 선택값으로 지정합니다.
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

  // 🧪 [채취량 및 수기 작성 상태 추가]
  const [sampleQty, setSampleQty] = useState('2g') // 기본값 2g
  const [isCustomSampleQty, setIsCustomSampleQty] = useState(false)

  // 🔎 [검색 전용 상태] 접수대장과 결과통보의 독립된 검색 제어 (기본값 공란 및 전체구분)
  const [searchProduct, setSearchProduct] = useState('')
  const [searchType, setSearchType] = useState('')

  // 📄 [페이지네이션 전용 상태] 한 페이지에 15행씩 출력 제어
  const [ledgerPage, setLedgerPage] = useState(1)
  const [resultPage, setResultPage] = useState(1)
  const itemsPerPage = 15 // 한 페이지에 노출할 최대 행 수

  // ✍️ [인라인 수정 기능 상태] 현재 수정 중인 행의 ID와 편집 필드 임시 보관함
  const [editingId, setEditingId] = useState<any>(null)
  const [editFields, setEditFields] = useState<any>({})

  // ✍️ [제조자 수기 작성 모드 상태] 드롭다운 외 직접 입력을 처리하기 위한 상태
  const [isCustomManufacturer, setIsCustomManufacturer] = useState(false)

  // ⚠️ 중요: 발급받으신 Supabase URL과 복사하신 Anon Key를 입력해 주세요!
  const SUPABASE_URL = 'https://ksuyhgnpiqnytafmabai.supabase.co'
  // 💡 아래 따옴표 안에 아까 찾으신 아주 긴 anon key(공개 API 키) 값을 붙여넣기 해주세요!
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
        script.onload = () => {
          initSupabase()
        }
        script.onerror = () => {
          console.error('Supabase 라이브러리 로드 실패')
          setDbError('데이터베이스 라이브러리를 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.')
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
        setDbError('Supabase 라이브러리가 로드되었으나 초기화할 수 없습니다.')
      }
    } catch (error) {
      console.error('Supabase 초기화 에러:', error)
      setDbError('데이터베이스 초기화 중 에러가 발생했습니다.')
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
      console.error('데이터 조회 실패:', error)
      setDbError(
        '데이터를 불러오지 못했습니다.\n\n' +
        '체크리스트:\n' +
        '1. 37번째 줄 코드에 실제 수파베이스 [anon] key값을 정확히 넣었는지 확인해 주세요.\n' +
        '2. Supabase 대시보드에 [requests] 테이블이 철자 그대로 생성되었는지 확인해 주세요.\n' +
        '3. [requests] 테이블의 Row Level Security(RLS)가 꺼져(disabled) 있는지 확인해 주세요.'
      )
    }
  }

  // ⭐ 사용자가 입력한 의뢰일(targetDate)을 기준으로 번호를 생성하는 로직
  const generateRequestNo = (currentSampleType: string, targetDate: string, currentList: any[]) => {
    if (!targetDate) return ''

    // 1. 날짜에서 하이픈(-) 등을 제거하고 숫자만 추출 후 YYMMDD 포맷팅 (예: "2026-05-19" -> "260519")
    const cleanDate = targetDate.replace(/[^0-9]/g, '')
    const datePart = cleanDate.substring(2, 8) 

    // 2. 샘플 유형별 접두사 매핑
    let prefixMap: { [key: string]: string } = {
      액체원료: 'ER',
      고체원료: 'ER',
      제품: 'EP',
      중간체: 'EB',
    }
    let prefix = prefixMap[currentSampleType] || 'ER'
    const fullPattern = prefix + datePart 

    // 3. 동기화된 리스트에서 '선택한 접두사 + 해당 날짜'로 이미 생성된 데이터 건수만 정밀 필터링
    const list = Array.isArray(currentList) ? currentList : []
    const sameDayCount = list.filter((item) =>
      item && item.requestNo && item.requestNo.startsWith(fullPattern)
    ).length

    // 4. 일련번호 2자리 포맷팅 (01, 02...)
    const serial = String(sameDayCount + 1).padStart(2, '0')

    return `${fullPattern}${serial}`
  }

  const saveData = async () => {
    if (!supabase) {
      alert('데이터베이스 연결이 준비되지 않았습니다.')
      return
    }

    try {
      const { data: latestData, error: fetchError } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: true })

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
        sampleQty: sampleQty || '', // ⭐ Supabase 새 필드 전송
      }

      const { error: insertError } = await supabase
        .from('requests')
        .insert([newItem])

      if (insertError) throw insertError

      await fetchData()
      
      alert(`저장 완료\n의뢰번호: ${autoRequestNo}\n성적번호: ${autoReportNo}`)
      
      // ⭐ 저장 완료 후 폼 입력값 리셋
      setRequester('')
      setProductName('O0330')
      setLotNo('')
      setSampleType('액체원료')
      setManufacturerSupplier('(주)파마코스텍') // 기본 선택 제조사로 리셋
      setIsCustomManufacturer(false)      // 수기 작성 모드 꺼짐 리셋
      setContainerQty('')
      setTotalQty('')
      setRemarks('')
      setSampleQty('2g')                 // 채취량 기본값 리셋
      setIsCustomSampleQty(false)        // 채취량 수기 모드 리셋
    } catch (error: any) {
      console.error('저장 에러:', error)
      alert(
        `데이터 저장에 실패했습니다.\n\n` +
        `이유(Error): ${error.message || '연결 실패'}\n` +
        `상세 내용(Details): ${error.details || '없음'}`
      )
    }
  }

  const deleteItem = async (id: any, index: number) => {
    if (!supabase) return
    const confirmDelete = window.confirm('선택한 의뢰를 삭제하시겠습니까?')
    if (!confirmDelete) return

    try {
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', id)

      if (error) throw error

      const updatedList = requestList.filter((_, i) => i !== index)
      setRequestList(updatedList)
    } catch (error: any) {
      console.error('삭제 에러:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  const updateResult = async (id: any, field: string, value: string) => {
    if (!supabase) return
    try {
      const { error } = await supabase
        .from('requests')
        .update({ [field]: value })
        .eq('id', id)

      if (error) throw error

      const updatedList = requestList.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
      setRequestList(updatedList)
    } catch (error: any) {
      console.error('수정 에러:', error)
      alert('수정에 실패했습니다.')
    }
  }

  // ✍️ [접수대장 인라인 수정 시작 처리]
  const startEditing = (item: any) => {
    setEditingId(item.id)
    setEditFields({ ...item }) // 기존 레코드 값을 편집창 임시 보관함에 복사
  }

  // ✍️ [접수대장 인라인 수정 필드 입력 변경]
  const handleEditChange = (field: string, value: string) => {
    setEditFields((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  // ✍️ [접수대장 인라인 수정 완료 및 수파베이스 동기화]
  const saveEditing = async (id: any) => {
    if (!supabase) return
    try {
      const { error } = await supabase
        .from('requests')
        .update({
          requester: editFields.requester,
          productName: editFields.productName,
          lotNo: editFields.lotNo,
          sampleType: editFields.sampleType,
          manufacturerSupplier: editFields.manufacturerSupplier,
          manufactureDate: editFields.manufactureDate,
          containerQty: editFields.containerQty,
          totalQty: editFields.totalQty,
          requestDate: editFields.requestDate,
          department: editFields.department,
          remarks: editFields.remarks,
          sampleQty: editFields.sampleQty, // ⭐ 편집 수정 저장 필드 추가
        })
        .eq('id', id)

      if (error) throw error

      // 화면 데이터 전면 갱신 (시험결과통보 탭 등 공유된 모든 레코드가 함께 갱신됩니다)
      await fetchData()
      setEditingId(null) // 편집 모드 종료
      alert('정상적으로 수정 완료되었습니다.')
    } catch (error: any) {
      console.error('수정 저장 실패:', error)
      alert('데이터 수정 저장에 실패했습니다.')
    }
  }

  // 🔍 공용 데이터 필터링 헬퍼 함수
  const getFilteredRequests = () => {
    return requestList.filter((item) => {
      const productMatch = !searchProduct || item.productName?.toLowerCase().includes(searchProduct.toLowerCase())
      const typeMatch = !searchType || item.sampleType === searchType
      return productMatch && typeMatch
    })
  }

// 엑셀 다운로드 함수
const downloadExcel = () => {
  const filteredData = getFilteredRequests();
  const headers = ["No", "시험항목", "의뢰자", "의뢰일", "의뢰번호", "성적번호", "품명", "제조번호", "제조자/납품자", "채취량", "제조/입고 일자", "용기수량", "입고수량", "의뢰부서", "비고"];
  
  // 데이터 내 쉼표가 있을 경우 따옴표로 감싸는 함수
  const formatCell = (cell) => {
    const value = String(cell || "");
    return value.includes(",") ? `"${value}"` : value;
  };
  
  const csvRows = filteredData.map((item, index) => [
    index + 1, 
    formatCell(item.sampleType), 
    formatCell(item.requester), 
    formatCell(item.requestDate), 
    formatCell(item.requestNo), 
    formatCell(item.reportNo),
    formatCell(item.productName), 
    formatCell(item.lotNo), 
    formatCell(item.manufacturerSupplier), 
    formatCell(item.sampleQty),
    formatCell(item.manufactureDate), 
    formatCell(item.containerQty), 
    formatCell(item.totalQty), 
    formatCell(item.department), 
    formatCell(item.remarks)
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
    <div className="p-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">시험 의뢰 관리 시스템 (Supabase)</h1>

      {!isDbReady && !dbError && (
        <div className="bg-yellow-50 text-yellow-800 p-3 rounded mb-6 text-sm border border-yellow-200">
          데이터베이스 연결을 준비 중입니다...
        </div>
      )}

      {dbError && (
        <div className="bg-red-50 text-red-800 p-4 rounded mb-6 text-sm border border-red-200 space-y-2">
          <p className="font-bold">⚠️ 데이터베이스 설정 안내</p>
          <pre className="whitespace-pre-wrap leading-relaxed text-xs bg-white p-3 rounded border border-red-100">{dbError}</pre>
          <div className="pt-2">
            <button 
              onClick={fetchData} 
              className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 font-semibold"
            >
              새로고침
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setActiveTab('request')}
          className={`border px-4 py-2 ${activeTab === 'request' ? 'bg-gray-200 font-bold' : ''}`}
        >
          시험의뢰
        </button>
        <button
          onClick={() => {
            setActiveTab('ledger')
            setLedgerPage(1) // 탭 클릭 시 첫 페이지로 이동
            setEditingId(null) // 편집 모드 리셋
          }}
          className={`border px-4 py-2 ${activeTab === 'ledger' ? 'bg-gray-200 font-bold' : ''}`}
        >
          접수대장
        </button>
        <button
          onClick={() => {
            setActiveTab('result')
            setResultPage(1) // 탭 클릭 시 첫 페이지로 이동
          }}
          className={`border px-4 py-2 ${activeTab === 'result' ? 'bg-gray-200 font-bold' : ''}`}
        >
          시험결과통보
        </button>
      </div>

      {activeTab === 'request' && (
        <div className="space-y-3">
          <div>
            <label className="block mb-1 font-semibold text-sm text-gray-700">의뢰자</label>
            <input
              className="border p-2 w-full rounded"
              placeholder="의뢰자 이름 입력"
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-sm text-gray-700">품명</label>
            <select
              className="border p-2 w-full rounded bg-white"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            >
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
          </div>

          <div>
            <label className="block mb-1 font-semibold text-sm text-gray-700">제조번호 (Lot No.)</label>
            <input
              className="border p-2 w-full rounded"
              placeholder="제조번호 입력"
              value={lotNo}
              onChange={(e) => setLotNo(e.target.value)}
            />
          </div>

          {/* 🏢 [제조자/납품자 드롭다운 및 직접수기입력 병행 처리] */}
          <div>
            <label className="block mb-1 font-semibold text-sm text-gray-700">제조자 / 납품자</label>
            {!isCustomManufacturer ? (
              <select
                className="border p-2 w-full rounded bg-white"
                value={manufacturerSupplier}
                onChange={(e) => {
                  if (e.target.value === 'custom_write') {
                    setIsCustomManufacturer(true)
                    setManufacturerSupplier('') // 빈 값으로 비우고 수기 입력 대기
                  } else {
                    setManufacturerSupplier(e.target.value)
                  }
                }}
              >
                <option value="">-- 제조/납품처 선택 --</option>
                {manufacturerList.map((mfg) => (
                  <option key={mfg} value={mfg}>{mfg}</option>
                ))}
                <option value="custom_write">🖋️ 직접 입력 (수기 작성)</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  className="border p-2 w-full rounded"
                  placeholder="(주)파마코스텍, SDC 등 직접 입력"
                  value={manufacturerSupplier}
                  onChange={(e) => setManufacturerSupplier(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomManufacturer(false)
                    setManufacturerSupplier('(주)파마코스텍') // 기본값 복원
                  }}
                  className="border px-4 py-2 bg-gray-100 rounded text-sm hover:bg-gray-200 font-semibold whitespace-nowrap"
                >
                  목록에서 선택
                </button>
              </div>
            )}
          </div>

          {/* 🧪 [채취량 드롭다운 및 직접 수기 작성 병행 처리 추가] */}
          <div>
            <label className="block mb-1 font-semibold text-sm text-gray-700">채취량</label>
            {!isCustomSampleQty ? (
              <select
                className="border p-2 w-full rounded bg-white"
                value={sampleQty}
                onChange={(e) => {
                  if (e.target.value === 'custom_qty_write') {
                    setIsCustomSampleQty(true)
                    setSampleQty('') // 빈 값으로 비우고 수기 입력 대기
                  } else {
                    setSampleQty(e.target.value)
                  }
                }}
              >
                {sampleQtyList.map((qty) => (
                  <option key={qty} value={qty}>{qty}</option>
                ))}
                <option value="custom_qty_write">🖋️ 직접 입력 (수기 작성)</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  className="border p-2 w-full rounded"
                  placeholder="예: 5g, 10g 등 직접 입력"
                  value={sampleQty}
                  onChange={(e) => setSampleQty(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomSampleQty(false)
                    setSampleQty('2g') // 기본값 복원
                  }}
                  className="border px-4 py-2 bg-gray-100 rounded text-sm hover:bg-gray-200 font-semibold whitespace-nowrap"
                >
                  목록에서 선택
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block mb-1 font-semibold text-sm text-gray-700">제조 / 입고 일자</label>
            <input
              type="date"
              className="border p-2 w-full rounded"
              value={manufactureDate}
              onChange={(e) => setManufactureDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-sm text-gray-700">용기 수량</label>
            <input
              className="border p-2 w-full rounded"
              placeholder="예: 10 Can, 5 Drum 등"
              value={containerQty}
              onChange={(e) => setContainerQty(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-sm text-gray-700">제조 / 입고 수량</label>
            <input
              className="border p-2 w-full rounded"
              placeholder="예: 200kg, 1,000L 등"
              value={totalQty}
              onChange={(e) => setTotalQty(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-sm text-gray-700">의뢰일</label>
            <input
              type="date"
              className="border p-2 w-full rounded"
              value={requestDate}
              onChange={(e) => setRequestDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-sm text-gray-700">의뢰부서</label>
            <select
              className="border p-2 w-full rounded bg-white"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="음성공장 합성팀">음성공장 합성팀</option>
              <option value="음성공장 품질팀">음성공장 품질팀</option>
              <option value="화성공장">화성공장</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-semibold text-sm text-gray-700">비고 (참고사항)</label>
            <input
              className="border p-2 w-full rounded"
              placeholder="비고 입력"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-semibold text-sm text-gray-700">시험항목 종류 (구분)</label>
            <select
              className="border p-2 w-full rounded bg-white"
              value={sampleType}
              onChange={(e) => setSampleType(e.target.value)}
            >
              <option value="액체원료">액체원료</option>
              <option value="고체원료">고체원료</option>
              <option value="중간체">중간체</option>
              <option value="제품">제품</option>
            </select>
          </div>

          <button onClick={saveData} className="bg-black text-white px-4 py-2 hover:bg-gray-800 w-full mt-4 rounded font-bold">
            저장
          </button>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="overflow-x-auto">
          <div className="mb-4 flex gap-3">
            <input
              type="text"
              placeholder="품목명 검색"
              className="border p-2 rounded"
              value={searchProduct}
              onChange={(e) => {
                setSearchProduct(e.target.value)
                setLedgerPage(1) // 검색 시 페이지 번호 초기화
              }}
            />
            <select
              className="border p-2 rounded bg-white"
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value)
                setLedgerPage(1) // 검색 시 페이지 번호 초기화
              }}
            >
              <option value="">전체 구분</option>
              <option value="액체원료">액체원료</option>
              <option value="고체원료">고체원료</option>
              <option value="제품">제품</option>
              <option value="중간체">중간체</option>
            </select>
            <button 
  onClick={downloadExcel} 
  className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 ml-2"
>
  Excel 다운로드
</button>
          </div>

          <table className="w-full border text-sm text-center whitespace-nowrap">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">No.</th>
                <th className="border p-2">시험항목</th>
                <th className="border p-2">의뢰자</th>
                <th className="border p-2">의뢰일</th>
                <th className="border p-2">의뢰번호</th>
                <th className="border p-2">성적번호</th>
                <th className="border p-2">품명</th>
                <th className="border p-2">제조번호</th>
                <th className="border p-2">제조자/납품자</th>
                <th className="border p-2">채취량</th> {/* ⭐ 접수대장에 채취량 컬럼 헤더 추가 */}
                <th className="border p-2">제조/입고 일자</th>
                <th className="border p-2">용기수량</th>
                <th className="border p-2">입고수량</th>
                <th className="border p-2">의뢰부서</th>
                <th className="border p-2">비고</th>
                <th className="border p-2">관리</th>
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
                        
                        {/* 1. 시험항목 구분 */}
                        <td className="border p-2">
                          {isEditing ? (
                            <select
                              className="border p-1 rounded bg-white text-xs"
                              value={editFields.sampleType || ''}
                              onChange={(e) => handleEditChange('sampleType', e.target.value)}
                            >
                              <option value="액체원료">액체원료</option>
                              <option value="고체원료">고체원료</option>
                              <option value="중간체">중간체</option>
                              <option value="제품">제품</option>
                            </select>
                          ) : (
                            item.sampleType
                          )}
                        </td>

                        {/* 2. 의뢰자 */}
                        <td className="border p-2">
                          {isEditing ? (
                            <input
                              type="text"
                              className="border p-1 rounded text-xs w-20"
                              value={editFields.requester || ''}
                              onChange={(e) => handleEditChange('requester', e.target.value)}
                            />
                          ) : (
                            item.requester || '-'
                          )}
                        </td>

                        {/* 3. 의뢰일 */}
                        <td className="border p-2">
                          {isEditing ? (
                            <input
                              type="date"
                              className="border p-1 rounded text-xs"
                              value={editFields.requestDate || ''}
                              onChange={(e) => handleEditChange('requestDate', e.target.value)}
                            />
                          ) : (
                            item.requestDate
                          )}
                        </td>

                        {/* 의뢰번호 / 성적번호 */}
                        <td className="border p-2 font-mono text-xs">{item.requestNo}</td>
                        <td className="border p-2 font-mono text-xs">{item.reportNo}</td>

                        {/* 4. 품명 */}
                        <td className="border p-2">
                          {isEditing ? (
                            <select
                              className="border p-1 rounded bg-white text-xs"
                              value={editFields.productName || ''}
                              onChange={(e) => handleEditChange('productName', e.target.value)}
                            >
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
                          ) : (
                            item.productName
                          )}
                        </td>

                        {/* 5. 제조번호 */}
                        <td className="border p-2">
                          {isEditing ? (
                            <input
                              type="text"
                              className="border p-1 rounded text-xs w-28"
                              value={editFields.lotNo || ''}
                              onChange={(e) => handleEditChange('lotNo', e.target.value)}
                            />
                          ) : (
                            item.lotNo
                          )}
                        </td>

                        {/* 6. 제조자/납품자 */}
                        <td className="border p-2">
                          {isEditing ? (
                            <input
                              type="text"
                              className="border p-1 rounded text-xs w-24"
                              value={editFields.manufacturerSupplier || ''}
                              onChange={(e) => handleEditChange('manufacturerSupplier', e.target.value)}
                            />
                          ) : (
                            item.manufacturerSupplier
                          )}
                        </td>

                        {/* ⭐ 채취량 컬럼 셀 렌더링 및 인라인 편집 구현 */}
                        <td className="border p-2 text-xs font-semibold">
                          {isEditing ? (
                            <input
                              type="text"
                              className="border p-1 rounded text-xs w-16"
                              value={editFields.sampleQty || ''}
                              onChange={(e) => handleEditChange('sampleQty', e.target.value)}
                            />
                          ) : (
                            item.sampleQty || '-'
                          )}
                        </td>

                        {/* 7. 제조/입고 일자 */}
                        <td className="border p-2">
                          {isEditing ? (
                            <input
                              type="date"
                              className="border p-1 rounded text-xs"
                              value={editFields.manufactureDate || ''}
                              onChange={(e) => handleEditChange('manufactureDate', e.target.value)}
                            />
                          ) : (
                            item.manufactureDate
                          )}
                        </td>

                        {/* 8. 용기수량 */}
                        <td className="border p-2">
                          {isEditing ? (
                            <input
                              type="text"
                              className="border p-1 rounded text-xs w-20"
                              value={editFields.containerQty || ''}
                              onChange={(e) => handleEditChange('containerQty', e.target.value)}
                            />
                          ) : (
                            item.containerQty
                          )}
                        </td>

                        {/* 9. 입고수량 */}
                        <td className="border p-2">
                          {isEditing ? (
                            <input
                              type="text"
                              className="border p-1 rounded text-xs w-20"
                              value={editFields.totalQty || ''}
                              onChange={(e) => handleEditChange('totalQty', e.target.value)}
                            />
                          ) : (
                            item.totalQty
                          )}
                        </td>

                        {/* 10. 의뢰부서 */}
                        <td className="border p-2">
                          {isEditing ? (
                            <select
                              className="border p-1 rounded bg-white text-xs"
                              value={editFields.department || ''}
                              onChange={(e) => handleEditChange('department', e.target.value)}
                            >
                              <option value="음성공장 합성팀">음성공장 합성팀</option>
                              <option value="음성공장 품질팀">음성공장 품질팀</option>
                              <option value="화성공장">화성공장</option>
                            </select>
                          ) : (
                            item.department
                          )}
                        </td>

                        {/* 11. 비고 */}
                        <td className="border p-2">
                          {isEditing ? (
                            <input
                              type="text"
                              className="border p-1 rounded text-xs w-32"
                              value={editFields.remarks || ''}
                              onChange={(e) => handleEditChange('remarks', e.target.value)}
                            />
                          ) : (
                            item.remarks
                          )}
                        </td>

                        {/* 🔧 관리 조작 버튼 영역 (수정/저장/취소/삭제) */}
                        <td className="border p-2">
                          <div className="flex justify-center gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => saveEditing(item.id)}
                                  className="border bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-xs font-semibold"
                                >
                                  저장
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="border bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 text-xs"
                                >
                                  취소
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEditing(item)}
                                  className="border bg-gray-50 text-gray-700 px-2 py-1 rounded hover:bg-gray-150 text-xs font-semibold"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => deleteItem(item.id, startIndex + index)}
                                  className="border bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 text-xs"
                                >
                                  삭제
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={16} className="border p-8 text-gray-500">
                      데이터가 존재하지 않습니다.
                    </td>
                  </tr>
                )
              })()}
            </tbody>
          </table>

          {/* 📄 접수대장 페이지네이션 UI */}
          {getFilteredRequests().length > itemsPerPage && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setLedgerPage(prev => Math.max(prev - 1, 1))}
                disabled={ledgerPage === 1}
                className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-semibold"
              >
                이전
              </button>
              {Array.from({ length: Math.ceil(getFilteredRequests().length / itemsPerPage) }, (_, idx) => (
                <button
                  key={idx + 1}
                  onClick={() => setLedgerPage(idx + 1)}
                  className={`px-3 py-1 border rounded text-sm font-semibold ${ledgerPage === idx + 1 ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setLedgerPage(prev => Math.min(prev + 1, Math.ceil(getFilteredRequests().length / itemsPerPage)))}
                disabled={ledgerPage === Math.ceil(getFilteredRequests().length / itemsPerPage)}
                className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-semibold"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'result' && (
        <div className="overflow-x-auto">
          {/* 🔎 [통합 필터 UI 적용] 결과통보 탭 최상단에도 기본 공란과 전체 구분의 검색 필터가 노출됩니다. */}
          <div className="mb-4 flex gap-3">
            <input
              type="text"
              placeholder="품목명 검색"
              className="border p-2 rounded"
              value={searchProduct}
              onChange={(e) => {
                setSearchProduct(e.target.value)
                setResultPage(1) // 검색 시 결과 탭 페이지 번호 초기화
              }}
            />
            <select
              className="border p-2 rounded bg-white"
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value)
                setResultPage(1) // 검색 시 결과 탭 페이지 번호 초기화
              }}
            >
              <option value="">전체 구분</option>
              <option value="액체원료">액체원료</option>
              <option value="고체원료">고체원료</option>
              <option value="제품">제품</option>
              <option value="중간체">중간체</option>
            </select>
          </div>

          <table className="w-full border text-center whitespace-nowrap text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">No.</th>
                <th className="border p-2">시험항목</th>
                <th className="border p-2">성적번호</th>
                <th className="border p-2">품목명</th>
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
                      <td className="border p-2">
                        <select
                          className="border p-1 w-full rounded bg-white"
                          value={item.judgement || ''}
                          onChange={(e) => updateResult(item.id, 'judgement', e.target.value)}
                        >
                          <option value="">선택</option>
                          <option value="적합">적합</option>
                          <option value="부적합">부적합</option>
                        </select>
                      </td>
                      <td className="border p-2">
                        <input
                          type="date"
                          className="border p-1 w-full rounded bg-white"
                          value={item.judgementDate || new Date().toISOString().split('T')[0]}
                          onChange={(e) => updateResult(item.id, 'judgementDate', e.target.value)}
                        />
                      </td>
                      <td className="border p-2">
                        <select
                          className="border p-1 w-full rounded bg-white"
                          value={item.labelQty || '없음'}
                          onChange={(e) => updateResult(item.id, 'labelQty', e.target.value)}
                        >
                          <option value="없음">없음</option>
                          {Array.from({ length: 500 }, (_, i) => (
                            <option key={i + 1} value={String(i + 1)}>
                              {i + 1}매
                          </option>
                        ))}
                        </select>
                      </td>
                      <td className="border p-2">
                        <button
                          onClick={() => deleteItem(item.id, startIndex + index)}
                          className="border bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="border p-8 text-gray-500">
                      데이터가 존재하지 않습니다.
                    </td>
                  </tr>
                )
              })()}
            </tbody>
          </table>

          {/* 📄 시험결과통보 페이지네이션 UI */}
          {getFilteredRequests().length > itemsPerPage && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setResultPage(prev => Math.max(prev - 1, 1))}
                disabled={resultPage === 1}
                className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-semibold"
              >
                이전
              </button>
              {Array.from({ length: Math.ceil(getFilteredRequests().length / itemsPerPage) }, (_, idx) => (
                <button
                  key={idx + 1}
                  onClick={() => setResultPage(idx + 1)}
                  className={`px-3 py-1 border rounded text-sm font-semibold ${resultPage === idx + 1 ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setResultPage(prev => Math.min(prev + 1, Math.ceil(getFilteredRequests().length / itemsPerPage)))}
                disabled={resultPage === Math.ceil(getFilteredRequests().length / itemsPerPage)}
                className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-semibold"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

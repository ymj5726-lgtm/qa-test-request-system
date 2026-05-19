'use client'

import { useEffect, useState } from 'react'

// Supabase 클라이언트 라이브러리를 위한 전역 변수
let supabase: any = null

export default function Home() {
  const [activeTab, setActiveTab] = useState('request')

  const [requester, setRequester] = useState('')
  const [lotNo, setLotNo] = useState('')
  const [sampleType, setSampleType] = useState('액체원료')
  const [requestList, setRequestList] = useState<any[]>([])

  const [judgement, setJudgement] = useState('')
  const [labelQty, setLabelQty] = useState('없음')
  const [manufacturerSupplier, setManufacturerSupplier] = useState('')
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

  // ⭐ [수정 완료] 사용자가 입력한 의뢰일(targetDate)을 기준으로 번호를 생성하는 로직
  // 일련번호 자릿수를 기존 3자리(001)에서 2자리(01)로 최적화했습니다.
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
    const fullPattern = prefix + datePart // 예: "ER260519"

    // 3. 동기화된 리스트에서 '선택한 접두사 + 해당 날짜'로 이미 생성된 데이터 건수만 정밀 필터링
    const list = Array.isArray(currentList) ? currentList : []
    const sameDayCount = list.filter((item) =>
      item && item.requestNo && item.requestNo.startsWith(fullPattern)
    ).length

    // 4. 일련번호 2자리 포맷팅 (01, 02...)
    // padStart(2, '0')를 사용해 100개 미만일 땐 2자리 유지, 100번째(100)부터는 자연스럽게 세 자리가 됩니다.
    const serial = String(sameDayCount + 1).padStart(2, '0')

    return `${fullPattern}${serial}`
  }

  const saveData = async () => {
    if (!supabase) {
      alert('데이터베이스 연결이 준비되지 않았습니다.')
      return
    }

    try {
      // 15명의 직원이 동시 사용할 때 일련번호의 혼선을 최소화하기 위해,
      // 저장 직전에 Supabase 서버로부터 최신 테이블 목록 데이터를 강제 동기화합니다.
      const { data: latestData, error: fetchError } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError
      
      const currentList = latestData || []
      setRequestList(currentList)

      // 최신화된 리스트와 사용자가 화면에 작성한 의뢰일(requestDate)을 넘겨 최종 고유 번호를 도출합니다.
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
      }

      // Supabase 테이블에 데이터 삽입
      const { error: insertError } = await supabase
        .from('requests')
        .insert([newItem])

      if (insertError) throw insertError

      // 성공 후 전체 리스트 리로드 및 화면 갱신
      await fetchData()
      
      alert(`저장 완료\n의뢰번호: ${autoRequestNo}\n성적번호: ${autoReportNo}`)
      
      // 입력 폼 초기화
      setRequester('')
      setLotNo('')
      setManufacturerSupplier('')
      setContainerQty('')
      setTotalQty('')
      setRemarks('')
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
          onClick={() => setActiveTab('ledger')}
          className={`border px-4 py-2 ${activeTab === 'ledger' ? 'bg-gray-200 font-bold' : ''}`}
        >
          접수대장
        </button>
        <button
          onClick={() => setActiveTab('result')}
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
              className="border p-2 w-full"
              placeholder="의뢰자 이름 입력"
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-sm text-gray-700">품명</label>
            <select
              className="border p-2 w-full"
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
              className="border p-2 w-full"
              placeholder="제조번호 입력"
              value={lotNo}
              onChange={(e) => setLotNo(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-sm text-gray-700">제조자 / 납품자</label>
            <input
              className="border p-2 w-full"
              placeholder="제조자 / 납품자 입력"
              value={manufacturerSupplier}
              onChange={(e) => setManufacturerSupplier(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-sm text-gray-700">제조 / 입고 일자</label>
            <input
              type="date"
              className="border p-2 w-full"
              value={manufactureDate}
              onChange={(e) => setManufactureDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-sm text-gray-700">용기 수량</label>
            <input
              className="border p-2 w-full"
              placeholder="예: 10 Can, 5 Drum 등"
              value={containerQty}
              onChange={(e) => setContainerQty(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-sm text-gray-700">제조 / 입고 수량</label>
            <input
              className="border p-2 w-full"
              placeholder="예: 200kg, 1,000L 등"
              value={totalQty}
              onChange={(e) => setTotalQty(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-sm text-gray-700">의뢰일</label>
            <input
              type="date"
              className="border p-2 w-full"
              value={requestDate}
              onChange={(e) => setRequestDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-sm text-gray-700">의뢰부서</label>
            <select
              className="border p-2 w-full"
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
              className="border p-2 w-full"
              placeholder="비고 입력"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-semibold text-sm text-gray-700">시험항목 종류 (구분)</label>
            <select
              className="border p-2 w-full"
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
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
            <select
              className="border p-2 rounded"
              value={sampleType}
              onChange={(e) => setSampleType(e.target.value)}
            >
              <option value="">전체 구분</option>
              <option value="액체원료">액체원료</option>
              <option value="고체원료">고체원료</option>
              <option value="제품">제품</option>
              <option value="중간체">중간체</option>
            </select>
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
                <th className="border p-2">제조/입고 일자</th>
                <th className="border p-2">용기수량</th>
                <th className="border p-2">입고수량</th>
                <th className="border p-2">의뢰부서</th>
                <th className="border p-2">비고</th>
                <th className="border p-2">삭제</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(requestList) && requestList.length > 0 ? (
                requestList
                  .filter((item) => {
                    const productMatch = !productName || item.productName?.toLowerCase().includes(productName.toLowerCase())
                    const typeMatch = !sampleType || item.sampleType === sampleType
                    return productMatch && typeMatch
                  })
                  .map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-gray-50">
                      <td className="border p-2">{index + 1}</td>
                      <td className="border p-2">{item.sampleType}</td>
                      <td className="border p-2">{item.requester || '-'}</td>
                      <td className="border p-2">{item.requestDate}</td>
                      <td className="border p-2">{item.requestNo}</td>
                      <td className="border p-2">{item.reportNo}</td>
                      <td className="border p-2">{item.productName}</td>
                      <td className="border p-2">{item.lotNo}</td>
                      <td className="border p-2">{item.manufacturerSupplier}</td>
                      <td className="border p-2">{item.manufactureDate}</td>
                      <td className="border p-2">{item.containerQty}</td>
                      <td className="border p-2">{item.totalQty}</td>
                      <td className="border p-2">{item.department}</td>
                      <td className="border p-2">{item.remarks}</td>
                      <td className="border p-2">
                        <button
                          onClick={() => deleteItem(item.id, index)}
                          className="border bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={15} className="border p-8 text-gray-500">
                    등록된 시험 의뢰 데이터가 없습니다. 첫 의뢰를 등록해 보세요!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'result' && (
        <div className="overflow-x-auto">
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
              {Array.isArray(requestList) && requestList.length > 0 ? (
                requestList.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    <td className="border p-2">{index + 1}</td>
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
                        onClick={() => deleteItem(item.id, index)}
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
                    결과를 등록할 시험 의뢰 데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

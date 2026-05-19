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
  // 💡 아래 따옴표 안에 아까 찾으신 아주 긴 anon key(공개 API 키) 값을 붙여넣기 해보세요.
  const SUPABASE_ANON_KEY = 'sb_publishable_NkNCMpef_PKL2Ho8TQDtNA_6NQzmupW'

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
      if (supabaseJS && SUPABASE_URL !== 'https://내프로젝트.supabase.co' && SUPABASE_ANON_KEY !== '내_비밀키_값_적는_곳') {
        supabase = supabaseJS.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        setIsDbReady(true)
        fetchData()
      } else {
        setIsDbReady(true)
        setDbError('Supabase API 설정(URL, Key)이 완료되지 않았습니다. 코드를 수정해 주세요.')
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
      // requests 테이블에서 데이터 가져오기
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      setRequestList(data || [])
    } catch (error: any) {
      console.error('데이터 조회 실패:', error)
      setDbError(
        '데이터를 불러오지 못했습니다.\n' +
        '1. Supabase 테이블이 생성되었는지 확인해 주세요.\n' +
        '2. RLS(Row Level Security) 설정이 비활성화 되어 있거나 정책이 구성되었는지 확인해 주세요.'
      )
    }
  }

  const generateRequestNo = (sampleType: string) => {
    const today = new Date()
    const year = String(today.getFullYear()).slice(-2)
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const datePart = `${year}${month}${day}`

    let prefixMap: { [key: string]: string } = {
      액체원료: 'ER',
      고체원료: 'ER',
      제품: 'EP',
      중간체: 'EB',
    }

    let prefix = prefixMap[sampleType] || 'ER'

    const list = Array.isArray(requestList) ? requestList : []
    const sameDayCount = list.filter((item) =>
      item && item.requestNo && item.requestNo.startsWith(prefix + datePart)
    ).length

    const serial = String(sameDayCount + 1).padStart(2, '0')

    return `${prefix}${datePart}${serial}`
  }

  const saveData = async () => {
    if (!supabase) {
      alert('데이터베이스 연결이 준비되지 않았습니다.')
      return
    }

    const autoRequestNo = generateRequestNo(sampleType)
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

    try {
      const { data, error } = await supabase
        .from('requests')
        .insert([newItem])
        .select()

      if (error) throw error

      setRequestList([...requestList, ...(data || [])])
      alert(`저장 완료\n의뢰번호: ${autoRequestNo}`)
      
      setRequester('')
      setLotNo('')
      setManufacturerSupplier('')
      setContainerQty('')
      setTotalQty('')
      setRemarks('')
    } catch (error: any) {
      console.error('저장 에러:', error)
      alert('데이터 저장에 실패했습니다. Supabase 테이블 및 RLS 설정을 확인해 주세요.')
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
      const { data, error } = await supabase
        .from('requests')
        .update({ [field]: value })
        .eq('id', id)
        .select()

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
          <p className="font-bold">⚠️ 데이터베이스 설정이 필요합니다</p>
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

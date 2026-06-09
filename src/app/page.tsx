"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEffect } from "react";

import { createGroup } from "@/app/actions/payments";
import { BackgroundImage } from "@/components/ui/BackgroundImage";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function Page() {
  const router = useRouter();
  const supabase = createClient();
  const [isCreating, setIsCreating] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [memberNames, setMemberNames] = useState<string[]>([]);

  useEffect(() => {
    document.body.classList.add("bg-landing-theme");
    return () => document.body.classList.remove("bg-landing-theme");
  }, []);

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    setMemberNames([...memberNames, newMemberName.trim()]);
    setNewMemberName("");
  };

  const removeMember = (index: number) => {
    setMemberNames(memberNames.filter((_, i) => i !== index));
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;

    if (!groupName.trim()) {
      alert("グループ名を入力してください");
      return;
    }

    if (memberNames.length < 2) {
      alert("メンバーを2名以上追加してください");
      return;
    }

    setIsCreating(true);
    try {
      // Ensure user is signed in (anonymously) before creating a group
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        const { error: authError } = await supabase.auth.signInAnonymously();
        if (authError) throw authError;
      }

      const result = await createGroup(groupName, memberNames);

      if (!result.success || !result.data) {
        alert(result.error || "グループの作成に失敗しました。");
        setIsCreating(false);
        return;
      }

      router.push(`/group/${result.data.id}`);
    } catch (error) {
      console.error("Error creating group:", error);
      alert("エラーが発生しました。");
      setIsCreating(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center font-sans p-8 text-center">
      <BackgroundImage src="/landing-bg.webp" priority />
      <div className="relative max-w-md w-full">
        <h1 className="text-6xl font-bold text-black mb-2 tracking-normal [text-shadow:_2px_2px_0_white,_-2px_2px_0_white,_2px_-2px_0_white,_-2px_-2px_0_white]">
          パリカン
        </h1>
        <p className="text-lg font-bold text-black mb-8 [text-shadow:_1px_1px_0_white,_-1px_1px_0_white,_1px_-1px_0_white,_-1px_-1px_0_white]">
          パッと割り勘しよう
        </p>

        <form
          onSubmit={handleCreateGroup}
          className="space-y-6 bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="text-left">
            <label className="block text-lg font-bold mb-2">グループ名</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="例：週末キャンプ"
              className="w-full border-4 border-black p-3 text-lg font-bold focus:outline-none bg-white focus:bg-yellow-50 h-[60px]"
              required
            />
          </div>

          <div className="text-left">
            <label className="block text-lg font-bold mb-2">メンバー</label>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="メンバー名を入力"
                className="flex-1 border-4 border-black p-3 text-base font-bold focus:outline-none bg-white focus:bg-yellow-50 h-[60px] w-full"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddMember();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleAddMember}
                variant="green"
                className="h-[60px] w-14 shrink-0"
              >
                <Plus className="w-6 h-6" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {memberNames.map((name, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-gray-200 border-4 border-black px-4 py-2 text-base font-bold"
                >
                  <span>{name}</span>
                  <button
                    type="button"
                    onClick={() => removeMember(index)}
                    className="text-red-500 font-bold hover:text-red-700 text-lg"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isCreating}
            loadingText="作成中..."
            className="w-full py-4 text-2xl tracking-widest mt-4"
          >
            START
          </Button>
        </form>
      </div>
      <p className="mt-12 text-black font-bold animate-pulse tracking-widest text-base [text-shadow:_1px_1px_0_white,_-1px_1px_0_white,_1px_-1px_0_white,_-1px_-1px_0_white]">
        スタートボタンを押してください
      </p>
    </div>
  );
}
